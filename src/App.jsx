import { useEffect, useMemo, useRef, useState } from 'react'
import { BrandMark } from './components/BrandMark'
import { MuseumStage } from './components/MuseumStage'
import { RouteRail } from './components/RouteRail'
import { navigationItems, timelineChapters } from './data'
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
  const videoPrimedRef = useRef(false)
  const reducedMotion = useReducedMotion()
  const compactPlayback = useCompactPlayback()
  const film = useScrollFilm({
    rootRef: journeyRef,
    videoRef,
    chapters: timelineChapters,
    src: compactPlayback
      ? '/assets/akar-aroma-film-mobile.mp4'
      : '/assets/akar-aroma-film.mp4',
    reducedMotion,
    compactPlayback,
  })
  const active = film.chapter
  const isMuseum = active.kind === 'specimen'
  const specimens = useMemo(() => timelineChapters.filter((chapter) => chapter.kind === 'specimen'), [])
  const accentStyle = useMemo(() => ({ '--scene-accent': active.accent }), [active.accent])
  const journeyHeight = `${Math.round((film.totalWeight + 1) * 100)}vh`

  const jumpTo = (chapterId) => {
    const root = journeyRef.current
    const range = film.ranges.find((chapter) => chapter.id === chapterId)
    if (!root || !range) return
    const distance = root.offsetHeight - window.innerHeight
    const inset = Math.min(0.008, (range.end - range.start) * 0.08)
    window.scrollTo({
      top: root.offsetTop + distance * (range.start + inset),
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }

  const primeVideo = () => {
    const video = videoRef.current
    if (!video || reducedMotion || videoPrimedRef.current) return
    videoPrimedRef.current = true
    const promise = video.play()
    promise?.then(() => video.pause()).catch(() => {})
  }

  return (
    <main onPointerDown={primeVideo}>
      <a className="skip-link" href="#scene-copy">Lewati ke cerita</a>

      <section
        className={`journey ${reducedMotion ? 'is-reduced' : ''} ${isMuseum ? 'is-museum' : ''}`}
        ref={journeyRef}
        style={{ ...accentStyle, '--journey-height': journeyHeight }}
        aria-label="Perjalanan kopi dan museum biji Akar dan Aroma"
      >
        <div className="stage">
          <div className="media" aria-hidden="true">
            {reducedMotion || film.error ? (
              <img key={active.id} className="media__still" src={active.image} alt="" />
            ) : (
              <>
                <img className={`media__poster ${film.ready ? 'is-hidden' : ''}`} src={timelineChapters[0].image} alt="" />
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

          {!reducedMotion && (
            <MuseumStage
              chapter={isMuseum ? active : specimens[0]}
              localProgress={isMuseum ? film.localProgress : 0}
              visible={isMuseum}
              shouldLoad={film.activeIndex >= 1 && film.activeIndex <= 7}
              compact={compactPlayback}
            />
          )}

          <header className="topbar">
            <button className="brand-button" type="button" onClick={() => jumpTo('lereng')}>
              <BrandMark />
            </button>
            <div className="topbar__aside">
              <span>{isMuseum ? 'Museum biji' : 'Arabika Nusantara'}</span>
              <span aria-hidden="true">{isMuseum ? 'Spesimen · 360°' : '08°S — 115°E'}</span>
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

          <div className={`scene-copy ${isMuseum ? 'is-specimen' : ''}`} id="scene-copy" aria-live="polite">
            <article key={active.id} className="scene-copy__inner">
              <div className="scene-copy__meta">
                <span>{active.eyebrow}</span>
                <span>{isMuseum
                  ? `${String(film.specimenIndex + 1).padStart(2, '0')} / ${String(specimens.length).padStart(2, '0')}`
                  : active.label}</span>
              </div>
              <h1>{active.title}</h1>
              <p>{active.body}</p>

              {isMuseum && (
                <div className="museum-index" aria-label="Lima spesimen museum">
                  {specimens.map((specimen, index) => (
                    <button
                      key={specimen.id}
                      type="button"
                      className={specimen.id === active.id ? 'is-active' : ''}
                      onClick={() => jumpTo(specimen.id)}
                      aria-label={`Ke spesimen ${index + 1}: ${specimen.label}`}
                      aria-current={specimen.id === active.id ? 'step' : undefined}
                    />
                  ))}
                </div>
              )}

              {active.sources && (
                <div className="source-links" aria-label="Referensi botani">
                  <span>Referensi</span>
                  {active.sources.map((source) => (
                    <a key={source.href} href={source.href} target="_blank" rel="noreferrer">{source.label} ↗</a>
                  ))}
                </div>
              )}

              {active.cta && (
                <button className="cta" type="button" onClick={() => jumpTo('lereng')}>
                  <span>{active.cta}</span>
                  <span className="cta__arrow" aria-hidden="true">↗</span>
                </button>
              )}
            </article>
          </div>

          <RouteRail
            items={navigationItems}
            activeId={film.routeId}
            onSelect={jumpTo}
          />

          <div className="scroll-cue" aria-hidden="true">
            <span>{isMuseum ? 'Gulir untuk memutar' : 'Gulir untuk menyusuri'}</span>
            <i><b /></i>
          </div>

          <footer className="stage-footer">
            <span>Demo eksperimental · 2026</span>
            <span>{reducedMotion ? 'Mode tenang' : isMuseum ? 'Scroll memutar spesimen' : 'Scroll menggerakkan kamera'}</span>
          </footer>
        </div>
      </section>
    </main>
  )
}
