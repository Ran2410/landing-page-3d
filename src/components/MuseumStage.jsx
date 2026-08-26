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
    bumpScale: options.bumpScale ?? 0.045,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
  })
}

function makeBeanGeometry(THREE, {
  width,
  height,
  depth,
  curve,
  grooveDepth,
  grooveWidth,
  asymmetry,
}) {
  const geometry = new THREE.SphereGeometry(1, 64, 48)
  const positions = geometry.attributes.position

  for (let index = 0; index < positions.count; index += 1) {
    const sourceX = positions.getX(index)
    const sourceY = positions.getY(index)
    const sourceZ = positions.getZ(index)
    const yNormal = sourceY
    const endTaper = 0.94 + 0.06 * (1 - Math.abs(yNormal))
    const sideBias = 1 + asymmetry * sourceX * (0.35 + 0.65 * (1 - yNormal * yNormal))
    let x = sourceX * width * endTaper * sideBias
    const y = sourceY * height
    let z = sourceZ * depth * (0.93 + 0.07 * Math.cos(yNormal * Math.PI))

    // A coffee bean has one continuous body. Push the front surface inward along
    // a softly curved centre line instead of assembling two separate lobes.
    if (sourceZ > 0) {
      const centre = curve * Math.sin(yNormal * Math.PI * 1.08)
      const distance = (x - centre) / Math.max(0.01, width * grooveWidth)
      const groove = Math.exp(-distance * distance * 2.6)
        * Math.pow(Math.max(0, 1 - yNormal * yNormal), 0.65)
        * Math.pow(sourceZ, 0.45)
      z -= depth * grooveDepth * groove
      x += centre * groove * 0.12
    }

    // Very small organic irregularity catches the museum light without turning
    // the silhouette into a mathematically perfect capsule.
    const irregularity = 1
      + 0.018 * Math.sin(sourceY * 13 + sourceX * 7)
      + 0.009 * Math.sin(sourceZ * 19 - sourceY * 8)
    positions.setXYZ(index, x * irregularity, y, z * irregularity)
  }

  positions.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

function makeBean(THREE, texture, {
  color = '#6B3523',
  width = 1.05,
  height = 1.5,
  depth = 0.56,
  curve = 0.08,
  grooveDepth = 0.52,
  grooveWidth = 0.15,
  asymmetry = 0.07,
  rotation = 0,
} = {}) {
  const group = new THREE.Group()
  const material = makeMaterial(THREE, texture, color)
  const bean = new THREE.Mesh(
    makeBeanGeometry(THREE, {
      width, height, depth, curve, grooveDepth, grooveWidth, asymmetry,
    }),
    material,
  )
  group.add(bean)

  const groovePoints = []
  for (let index = 0; index <= 12; index += 1) {
    const yNormal = -0.73 + (index / 12) * 1.46
    const x = curve * Math.sin(yNormal * Math.PI * 1.08)
    const surface = depth * Math.sqrt(Math.max(0, 1 - yNormal * yNormal))
    const valley = surface - depth * grooveDepth * Math.pow(Math.max(0, 1 - yNormal * yNormal), 0.65)
    groovePoints.push(new THREE.Vector3(x, yNormal * height, valley + depth * 0.025))
  }
  const grooveCurve = new THREE.CatmullRomCurve3(groovePoints)
  const groove = new THREE.Mesh(
    new THREE.TubeGeometry(grooveCurve, 48, Math.max(0.009, width * 0.012), 8, false),
    new THREE.MeshStandardMaterial({ color: '#1b0d09', roughness: 1 }),
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

  const leftSeed = makeBean(THREE, texture, {
    color: '#A7A27A', width: 0.39, height: 0.87, depth: 0.3,
    curve: 0.025, grooveDepth: 0.32, grooveWidth: 0.16, asymmetry: 0.03,
  })
  const rightSeed = makeBean(THREE, texture, {
    color: '#A7A27A', width: 0.39, height: 0.87, depth: 0.3,
    curve: -0.025, grooveDepth: 0.32, grooveWidth: 0.16, asymmetry: -0.03,
  })
  leftSeed.position.x = -0.47
  rightSeed.position.x = 0.47
  leftSeed.rotation.z = -0.05
  rightSeed.rotation.z = 0.05
  group.add(leftSeed, rightSeed)
  return group
}

function makeSpecimens(THREE, texture) {
  const roasted = makeBean(THREE, texture, { color: '#512719', width: 1.02, height: 1.3, depth: 0.64, curve: 0.11, grooveDepth: 0.58, rotation: 0.09 })
  const anatomy = makeAnatomy(THREE, texture)
  const arabica = makeBean(THREE, texture, { color: '#66331F', width: 0.98, height: 1.36, depth: 0.6, curve: 0.18, grooveDepth: 0.58, grooveWidth: 0.14, asymmetry: 0.08, rotation: 0.07 })
  const robusta = makeBean(THREE, texture, { color: '#4C251A', width: 1.08, height: 1.15, depth: 0.67, curve: 0.035, grooveDepth: 0.5, grooveWidth: 0.13, asymmetry: 0.035, rotation: -0.05 })

  const beyond = new THREE.Group()
  const liberica = makeBean(THREE, texture, { color: '#663A27', width: 0.92, height: 1.4, depth: 0.58, curve: 0.14, grooveDepth: 0.54, rotation: -0.08 })
  const excelsa = makeBean(THREE, texture, { color: '#51291D', width: 0.75, height: 1.15, depth: 0.5, curve: 0.07, grooveDepth: 0.48, rotation: 0.11 })
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
