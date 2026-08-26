import { useEffect, useRef, useState } from 'react'

const FULL_TURN = 360

export function MuseumStage({
  chapter,
  localProgress,
  visible,
  shouldLoad,
  compact,
}) {
  const specimenRef = useRef(null)
  const manualRotationRef = useRef(0)
  const dragRef = useRef({ active: false, x: 0 })
  const stateRef = useRef({ localProgress, visible })
  const [photoState, setPhotoState] = useState('loading')
  stateRef.current = { localProgress, visible }

  const applyRotation = () => {
    const specimen = specimenRef.current
    if (!specimen) return
    const scrollRotation = stateRef.current.localProgress * FULL_TURN
    specimen.style.transform = `rotate(${scrollRotation + manualRotationRef.current}deg) scale(1.035)`
  }

  useEffect(() => {
    applyRotation()
  }, [chapter, localProgress, visible])

  useEffect(() => {
    manualRotationRef.current = 0
    setPhotoState('loading')
    applyRotation()
  }, [chapter.id])

  const rotateBy = (degrees) => {
    manualRotationRef.current += degrees
    applyRotation()
  }

  const onPointerDown = (event) => {
    dragRef.current = { active: true, x: event.clientX }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event) => {
    if (!dragRef.current.active) return
    const delta = event.clientX - dragRef.current.x
    dragRef.current.x = event.clientX
    rotateBy(delta * 0.5)
  }

  const onPointerUp = (event) => {
    dragRef.current.active = false
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  const onKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    rotateBy(event.key === 'ArrowLeft' ? -15 : 15)
  }

  const source = shouldLoad ? chapter.image : undefined
  const ready = photoState === 'ready'

  return (
    <div className={`museum ${visible ? 'is-visible' : ''} ${ready ? 'has-photo' : ''} ${photoState === 'error' ? 'is-fallback' : ''}`} aria-hidden={!visible}>
      <div className="museum__backdrop" />
      <img key={`backdrop-${chapter.image}`} className="museum__photo" src={source} alt="" />

      <div
        className="museum__viewport"
        tabIndex={visible && ready ? 0 : -1}
        role="img"
        aria-label={`Foto spesimen ${chapter.label}. Gulir atau seret untuk memutar 360 derajat.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <div className="museum__specimen-shell">
          <img
            key={chapter.image}
            ref={specimenRef}
            className="museum__specimen-photo"
            src={source}
            alt={`Foto ${chapter.label}`}
            draggable="false"
            onLoad={() => setPhotoState('ready')}
            onError={() => setPhotoState('error')}
          />
          <span className="museum__specimen-ring" aria-hidden="true" />
        </div>
      </div>

      <div className="museum__plaque">
        <span>{chapter.specimen?.stat}</span>
        <p>{chapter.specimen?.note}</p>
      </div>
      <div className="museum__control" aria-hidden="true">
        <span>360°</span>
        <i />
        <span>{compact ? 'Gulir · seret' : 'Gulir · seret · panah'}</span>
      </div>
      {photoState === 'error' && (
        <div className="museum__photo-error" role="status">Foto spesimen tidak dapat dimuat.</div>
      )}
    </div>
  )
}
