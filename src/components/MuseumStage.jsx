import { useEffect, useRef, useState } from 'react'

const TAU = Math.PI * 2

function makeTexture(THREE) {
  const size = 128
  const data = new Uint8Array(size * size * 4)
  let seed = 8417
  for (let index = 0; index < size * size; index += 1) {
    seed = (seed * 16807) % 2147483647
    const value = 112 + (seed % 94)
    const offset = index * 4
    data[offset] = value
    data[offset + 1] = value
    data[offset + 2] = value
    data[offset + 3] = 255
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2.5, 2.5)
  texture.needsUpdate = true
  return texture
}

function makeMaterial(THREE, texture, color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: options.roughness ?? 0.68,
    metalness: 0,
    clearcoat: options.clearcoat ?? 0.08,
    clearcoatRoughness: 0.7,
    bumpMap: texture,
    bumpScale: options.bumpScale ?? 0.11,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: THREE.DoubleSide,
  })
}

function makeBean(THREE, texture, {
  color = '#6B3523',
  width = 1.05,
  height = 1.5,
  depth = 0.56,
  curve = 0.08,
  rotation = 0,
} = {}) {
  const group = new THREE.Group()
  const material = makeMaterial(THREE, texture, color)
  const lobeGeometry = new THREE.SphereGeometry(1, 48, 36)
  lobeGeometry.scale(width * 0.58, height, depth)

  const left = new THREE.Mesh(lobeGeometry, material)
  const right = new THREE.Mesh(lobeGeometry.clone(), material)
  left.position.x = -width * 0.28
  right.position.x = width * 0.28
  left.rotation.z = -curve * 0.3
  right.rotation.z = curve * 0.3
  group.add(left, right)

  const grooveCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-curve * 0.4, -height * 0.72, depth * 0.93),
    new THREE.Vector3(curve, -height * 0.25, depth * 1.01),
    new THREE.Vector3(-curve, height * 0.2, depth * 1.01),
    new THREE.Vector3(curve * 0.35, height * 0.72, depth * 0.93),
  ])
  const groove = new THREE.Mesh(
    new THREE.TubeGeometry(grooveCurve, 36, Math.max(0.024, width * 0.032), 10, false),
    new THREE.MeshStandardMaterial({ color: '#190d09', roughness: 1 }),
  )
  group.add(groove)
  group.rotation.z = rotation
  return group
}

function makeAnatomy(THREE, texture) {
  const group = new THREE.Group()
  const cherry = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 48, 36),
    makeMaterial(THREE, texture, '#A5362E', {
      transparent: true,
      opacity: 0.22,
      roughness: 0.35,
      clearcoat: 0.45,
      bumpScale: 0.018,
    }),
  )
  cherry.scale.set(1, 1.08, 0.82)
  group.add(cherry)

  const seedGeometry = new THREE.SphereGeometry(1, 44, 32)
  seedGeometry.scale(0.42, 1, 0.34)
  const seedMaterial = makeMaterial(THREE, texture, '#A7A27A', { roughness: 0.82, bumpScale: 0.055 })
  const leftSeed = new THREE.Mesh(seedGeometry, seedMaterial)
  const rightSeed = new THREE.Mesh(seedGeometry.clone(), seedMaterial)
  leftSeed.position.x = -0.47
  rightSeed.position.x = 0.47
  leftSeed.rotation.z = -0.05
  rightSeed.rotation.z = 0.05
  group.add(leftSeed, rightSeed)
  return group
}

function makeSpecimens(THREE, texture) {
  const roasted = makeBean(THREE, texture, { color: '#522819', width: 1.08, height: 1.5, depth: 0.62, curve: 0.12, rotation: 0.12 })
  const anatomy = makeAnatomy(THREE, texture)
  const arabica = makeBean(THREE, texture, { color: '#744027', width: 0.92, height: 1.72, depth: 0.55, curve: 0.24, rotation: 0.08 })
  const robusta = makeBean(THREE, texture, { color: '#542A1E', width: 1.2, height: 1.28, depth: 0.65, curve: 0.025, rotation: -0.08 })

  const beyond = new THREE.Group()
  const liberica = makeBean(THREE, texture, { color: '#70402B', width: 0.96, height: 1.7, depth: 0.55, curve: 0.16, rotation: -0.1 })
  const excelsa = makeBean(THREE, texture, { color: '#5B3023', width: 0.72, height: 1.4, depth: 0.48, curve: 0.08, rotation: 0.14 })
  liberica.position.x = -0.9
  excelsa.position.x = 0.95
  beyond.add(liberica, excelsa)

  return { roasted, anatomy, arabica, robusta, beyond }
}

export function MuseumStage({
  chapter,
  localProgress,
  visible,
  shouldLoad,
  reducedMotion,
  compact,
}) {
  const canvasRef = useRef(null)
  const viewportRef = useRef(null)
  const renderRef = useRef(() => {})
  const sceneRef = useRef(null)
  const manualRotationRef = useRef(0)
  const dragRef = useRef({ active: false, x: 0 })
  const stateRef = useRef({ chapter, localProgress, visible })
  const [webglState, setWebglState] = useState('idle')
  stateRef.current = { chapter, localProgress, visible }

  useEffect(() => {
    if (!shouldLoad || reducedMotion || !canvasRef.current || !viewportRef.current) return undefined

    let disposed = false
    let cleanup = () => {}
    setWebglState('loading')

    import('three')
      .then((THREE) => {
        if (disposed) return
        const canvas = canvasRef.current
        const viewport = viewportRef.current
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !compact, powerPreference: 'high-performance' })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.5))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 0.86

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 30)
        camera.position.set(0, 0.05, 6.2)
        const texture = makeTexture(THREE)
        const specimens = makeSpecimens(THREE, texture)
        Object.values(specimens).forEach((object) => scene.add(object))

        scene.add(new THREE.HemisphereLight('#F6E0B6', '#130907', 1.15))
        const key = new THREE.DirectionalLight('#FFDCA1', 4.2)
        key.intensity = 2.6
        key.position.set(-3, 4, 5)
        scene.add(key)
        const rim = new THREE.PointLight('#B64A36', 24, 10)
        rim.position.set(3.5, 0.8, 2)
        scene.add(rim)

        const floor = new THREE.Mesh(
          new THREE.CircleGeometry(3.1, 64),
          new THREE.MeshBasicMaterial({ color: '#5A2D20', transparent: true, opacity: 0.12, side: THREE.DoubleSide }),
        )
        floor.rotation.x = Math.PI / 2
        floor.position.y = -1.72
        scene.add(floor)

        const resize = () => {
          const width = Math.max(1, viewport.clientWidth)
          const height = Math.max(1, viewport.clientHeight)
          renderer.setSize(width, height, false)
          camera.aspect = width / height
          camera.updateProjectionMatrix()
        }

        const render = () => {
          if (disposed) return
          const current = stateRef.current
          const type = current.chapter?.specimen?.type || 'roasted'
          Object.entries(specimens).forEach(([name, object]) => { object.visible = name === type })
          const active = specimens[type]
          if (active) {
            active.rotation.x = -0.08
            active.rotation.y = current.localProgress * TAU + manualRotationRef.current
          }
          if (current.visible) renderer.render(scene, camera)
        }

        const observer = new ResizeObserver(() => {
          resize()
          render()
        })
        observer.observe(viewport)
        const onContextLost = (event) => {
          event.preventDefault()
          setWebglState('error')
        }
        canvas.addEventListener('webglcontextlost', onContextLost)
        resize()
        renderRef.current = render
        sceneRef.current = specimens
        setWebglState('ready')
        render()

        cleanup = () => {
          observer.disconnect()
          canvas.removeEventListener('webglcontextlost', onContextLost)
          scene.traverse((object) => {
            object.geometry?.dispose?.()
            if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
            else object.material?.dispose?.()
          })
          texture.dispose()
          renderer.dispose()
          renderRef.current = () => {}
          sceneRef.current = null
        }
      })
      .catch(() => {
        if (!disposed) setWebglState('error')
      })

    return () => {
      disposed = true
      cleanup()
    }
  }, [compact, reducedMotion, shouldLoad])

  useEffect(() => {
    renderRef.current()
  }, [chapter, localProgress, visible])

  const rotateBy = (delta) => {
    manualRotationRef.current += delta
    renderRef.current()
  }

  const onPointerDown = (event) => {
    dragRef.current = { active: true, x: event.clientX }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event) => {
    if (!dragRef.current.active) return
    const delta = event.clientX - dragRef.current.x
    dragRef.current.x = event.clientX
    rotateBy(delta * 0.012)
  }

  const onPointerUp = (event) => {
    dragRef.current.active = false
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  const onKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    rotateBy(event.key === 'ArrowLeft' ? -Math.PI / 12 : Math.PI / 12)
  }

  const ready = webglState === 'ready'
  const fallbackOnly = reducedMotion || webglState === 'error'

  return (
    <div className={`museum ${visible ? 'is-visible' : ''} ${ready ? 'has-webgl' : ''} ${fallbackOnly ? 'is-fallback' : ''}`} aria-hidden={!visible}>
      <div className="museum__backdrop" />
      <img key={chapter.image} className="museum__photo" src={chapter.image} alt="" />
      <div className="museum__viewport" ref={viewportRef}>
        <canvas
          ref={canvasRef}
          className="museum__canvas"
          tabIndex={visible && ready ? 0 : -1}
          aria-label={`Model 3D ${chapter.label}. Gulir atau seret untuk memutar.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
        />
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
    </div>
  )
}
