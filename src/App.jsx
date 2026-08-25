import { useEffect, useMemo, useRef, useState } from 'react'
import { BrandMark } from './components/BrandMark'
import { RouteRail } from './components/RouteRail'
import { sections } from './data'
import { useScrollFilm } from './hooks/useScrollFilm'

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}

function useCompactPlayback() {
  const query = '(max-width: 860px), (pointer: coarse)'
  const [compact, setCompact] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setCompact(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return compact
}

export default function App() {
  const journeyRef = useRef(null)
  const videoRef = useRef(null)
  const reducedMotion = useReducedMotion()
  const compactPlayback = useCompactPlayback()
  const film = useScrollFilm({
    rootRef: journeyRef,
    videoRef,
    sections,
    src: compactPlayback
      ? '/assets/akar-aroma-film-mobile.mp4'
      : '/assets/akar-aroma-film.mp4',
    reducedMotion,
  })
  const active = sections[film.activeIndex]
  const accentStyle = useMemo(() => ({ '--scene-accent': active.accent }), [active.accent])

  const jumpTo = (index) => {
    const root = journeyRef.current
    if (!root) return
    const distance = root.offsetHeight - window.innerHeight
    const progress = sections[index].start + 0.025
    window.scrollTo({ top: root.offsetTop + distance * progress, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  const primeVideo = () => {
    const video = videoRef.current
    if (!video || reducedMotion) return
    const promise = video.play()
    promise?.then(() => video.pause()).catch(() => {})
  }

  return (
    <main onPointerDown={primeVideo}>
      <a className="skip-link" href="#scene-copy">Lewati ke cerita</a>

      <section
        className={`journey ${reducedMotion ? 'is-reduced' : ''}`}
        ref={journeyRef}
        style={{ ...accentStyle, '--journey-scenes': sections.length }}
        aria-label="Perjalanan kopi Akar dan Aroma"
      >
        <div className="stage">
          <div className="media" aria-hidden="true">
            {reducedMotion || film.error ? (
              <img key={active.id} className="media__still" src={active.image} alt="" />
            ) : (
              <>
                <img className={`media__poster ${film.ready ? 'is-hidden' : ''}`} src={sections[0].image} alt="" />
                <video
                  ref={videoRef}
                  className={`media__video ${film.ready ? 'is-ready' : ''}`}
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={film.onLoadedMetadata}
                />
              </>
            )}
            <div className="media__wash" />
            <div className="media__grain" />
          </div>

          <header className="topbar">
            <button className="brand-button" type="button" onClick={() => jumpTo(0)}>
              <BrandMark />
            </button>
            <div className="topbar__aside">
              <span>Arabika Nusantara</span>
              <span aria-hidden="true">08°S — 115°E</span>
            </div>
          </header>

          {!reducedMotion && !film.ready && !film.error && (
            <div className="loader" role="status" aria-live="polite">
              <span className="loader__bean" aria-hidden="true" />
              <div>
                <span>Menyiapkan dunia</span>
                <strong>{film.loadProgress}%</strong>
              </div>
              <span className="loader__line"><i style={{ width: `${film.loadProgress}%` }} /></span>
            </div>
          )}

          {film.error && (
            <div className="load-error" role="alert">
              <strong>Film belum dapat dimuat.</strong>
              <span>{film.error}. Poster perjalanan tetap tersedia.</span>
            </div>
          )}

          <div className="scene-copy" id="scene-copy" aria-live="polite">
            <article key={active.id} className="scene-copy__inner">
              <div className="scene-copy__meta">
                <span>{active.eyebrow}</span>
                <span>{String(film.activeIndex + 1).padStart(2, '0')} / {String(sections.length).padStart(2, '0')}</span>
              </div>
              <h1>{active.title}</h1>
              <p>{active.body}</p>
              {active.cta && (
                <button className="cta" type="button" onClick={() => jumpTo(0)}>
                  <span>{active.cta}</span>
                  <span className="cta__arrow" aria-hidden="true">↗</span>
                </button>
              )}
            </article>
          </div>

          <RouteRail sections={sections} activeIndex={film.activeIndex} onSelect={jumpTo} />

          <div className="scroll-cue" aria-hidden="true">
            <span>Gulir untuk menyusuri</span>
            <i><b /></i>
          </div>

          <footer className="stage-footer">
            <span>Demo eksperimental · 2026</span>
            <span>{reducedMotion ? 'Mode tenang' : 'Scroll menggerakkan kamera'}</span>
          </footer>
        </div>
      </section>
    </main>
  )
}
