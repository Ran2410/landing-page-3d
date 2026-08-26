import { useEffect, useMemo, useRef, useState } from 'react'
import { buildTimelineRanges, mapTimeline, scrollProgress } from '../utils/scroll'

async function fetchAsBlob(url, onProgress, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Video gagal dimuat (${response.status})`)

  const total = Number(response.headers.get('content-length')) || 0
  if (!response.body) {
    onProgress(100)
    return response.blob()
  }

  const reader = response.body.getReader()
  const chunks = []
  let received = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    onProgress(total ? Math.round((received / total) * 100) : 60)
  }

  onProgress(100)
  return new Blob(chunks, { type: 'video/mp4' })
}

export function useScrollFilm({
  rootRef,
  videoRef,
  chapters,
  src,
  reducedMotion,
  compactPlayback,
}) {
  const { ranges, totalWeight } = useMemo(
    () => buildTimelineRanges(chapters, compactPlayback),
    [chapters, compactPlayback],
  )
  const [timeline, setTimeline] = useState(() => mapTimeline(0, ranges))
  const [loadProgress, setLoadProgress] = useState(reducedMotion ? 100 : 0)
  const [ready, setReady] = useState(reducedMotion)
  const [error, setError] = useState('')
  const desiredVideoTimeRef = useRef(0)
  const desiredIsMuseumRef = useRef(false)
  const objectUrlRef = useRef('')

  useEffect(() => {
    if (reducedMotion) {
      setLoadProgress(100)
      setReady(true)
      setError('')
      return undefined
    }

    const controller = new AbortController()
    setLoadProgress(0)
    setReady(false)
    setError('')

    fetchAsBlob(src, setLoadProgress, controller.signal)
      .then((blob) => {
        objectUrlRef.current = URL.createObjectURL(blob)
        if (videoRef.current) videoRef.current.src = objectUrlRef.current
      })
      .catch((reason) => {
        if (reason.name !== 'AbortError') setError(reason.message)
      })

    return () => {
      controller.abort()
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = ''
    }
  }, [reducedMotion, src, videoRef])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const video = videoRef.current
    const minimumSeekInterval = compactPlayback ? 72 : 48
    const minimumTimeDelta = compactPlayback ? 0.1 : 0.05
    let animationFrame = 0
    let seekTimer = 0
    let lastSeekAt = 0
    let queuedTime = null
    let disposed = false

    const requestSeek = () => {
      if (disposed || animationFrame || seekTimer) return
      animationFrame = requestAnimationFrame((now) => {
        animationFrame = 0
        flushSeek(now)
      })
    }

    const flushSeek = (now = performance.now()) => {
      if (!video || video.readyState < 1) return

      const nextTime = Math.min(desiredVideoTimeRef.current, Math.max(0, video.duration - 0.04))
      const seekTolerance = desiredIsMuseumRef.current ? 0.01 : minimumTimeDelta
      if (video.seeking) {
        queuedTime = nextTime
        return
      }

      if (Math.abs(video.currentTime - nextTime) <= seekTolerance) {
        queuedTime = null
        return
      }

      const wait = minimumSeekInterval - (now - lastSeekAt)
      if (wait > 0) {
        seekTimer = window.setTimeout(() => {
          seekTimer = 0
          requestSeek()
        }, wait)
        return
      }

      queuedTime = nextTime
      lastSeekAt = performance.now()
      if (typeof video.fastSeek === 'function' && Math.abs(video.currentTime - nextTime) > 0.75) {
        video.fastSeek(nextTime)
      } else {
        video.currentTime = nextTime
      }
    }

    const updateTarget = () => {
      const rect = root.getBoundingClientRect()
      const progress = scrollProgress(rect.top, root.offsetHeight, window.innerHeight)
      const nextTimeline = mapTimeline(progress, ranges)
      const videoTargetChanged = Math.abs(nextTimeline.videoTime - desiredVideoTimeRef.current) > 0.001
      desiredVideoTimeRef.current = nextTimeline.videoTime
      desiredIsMuseumRef.current = nextTimeline.chapter.kind === 'specimen'
      setTimeline(nextTimeline)
      if (videoTargetChanged) requestSeek()
    }

    const onSeeked = () => {
      const seekTolerance = desiredIsMuseumRef.current ? 0.01 : minimumTimeDelta
      if (queuedTime !== null || Math.abs(video.currentTime - desiredVideoTimeRef.current) > seekTolerance) {
        requestSeek()
      }
    }

    updateTarget()
    window.addEventListener('scroll', updateTarget, { passive: true })
    window.addEventListener('resize', updateTarget)
    video?.addEventListener('loadedmetadata', requestSeek)
    video?.addEventListener('seeked', onSeeked)

    return () => {
      disposed = true
      cancelAnimationFrame(animationFrame)
      clearTimeout(seekTimer)
      window.removeEventListener('scroll', updateTarget)
      window.removeEventListener('resize', updateTarget)
      video?.removeEventListener('loadedmetadata', requestSeek)
      video?.removeEventListener('seeked', onSeeked)
    }
  }, [compactPlayback, ranges, rootRef, src, videoRef])

  return {
    ...timeline,
    ranges,
    totalWeight,
    loadProgress,
    ready,
    error,
    onLoadedMetadata: () => setReady(true),
  }
}
