import * as THREE from 'three'
import { type Ref, watch, onUnmounted } from 'vue'

interface ThreeSceneOptions {
  canvas: Ref<HTMLCanvasElement | null>
  activeIndex: Ref<number>
  completedNodes: Ref<boolean[]>
  nodeCount: number
}

export function useThreeScene(options: ThreeSceneOptions): {
  dispose: () => void
} {
  const { canvas, activeIndex, completedNodes, nodeCount } = options
  let animationId: number
  
  // Scene
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x080816)
  scene.fog = new THREE.FogExp2(0x080816, 0.015)

  // Camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  
  // Node positions
  const nodePositions: THREE.Vector3[] = []
  for (let i = 0; i < nodeCount; i++) {
    const x = (i % 2 === 0) ? -3.5 : 3.5
    const y = ((nodeCount - 1) / 2 - i) * 3.5
    const z = 0
    nodePositions.push(new THREE.Vector3(x, y, z))
  }
  
  camera.position.set(0, nodePositions[0].y, 14)

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404080, 0.4)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  // Renderer
  let renderer: THREE.WebGLRenderer

  // Meshes
  const boxGeometry = new THREE.BoxGeometry(2, 1, 0.4, 4, 4, 4)
  const nodeMeshes: { mesh: THREE.Mesh, material: THREE.MeshStandardMaterial, pointLight: THREE.PointLight }[] = []

  for (let i = 0; i < nodeCount; i++) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xffe500,
      emissive: 0xffe500,
      emissiveIntensity: 0.05,
      metalness: 0.2,
      roughness: 0.5,
      transparent: true,
      opacity: 0.9,
    })
    const mesh = new THREE.Mesh(boxGeometry, material)
    mesh.position.copy(nodePositions[i])
    
    const pointLight = new THREE.PointLight(0xffe500, 0, 5)
    mesh.add(pointLight)
    
    scene.add(mesh)
    nodeMeshes.push({ mesh, material, pointLight })
  }

  // Path connecting nodes
  const curve = new THREE.CatmullRomCurve3(nodePositions, false, 'catmullrom', 0.5)
  const tubeGeometry = new THREE.TubeGeometry(curve, 80, 0.06, 8, false)
  const pathMaterial = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    emissive: 0x3b82f6,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.7,
  })
  const pathMesh = new THREE.Mesh(tubeGeometry, pathMaterial)
  scene.add(pathMesh)

  // Particles
  const particleCount = 800
  const particlesGeometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 50
    positions[i * 3 + 1] = (Math.random() - 0.5) * 50
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5
  }
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particlesMaterial = new THREE.PointsMaterial({
    color: 0xaaaaff,
    size: 0.08,
    transparent: true,
    opacity: 0.5,
  })
  const particles = new THREE.Points(particlesGeometry, particlesMaterial)
  scene.add(particles)

  function handleResize() {
    if (!canvas.value || !renderer) return
    const width = window.innerWidth
    const height = window.innerHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  function animate() {
    animationId = requestAnimationFrame(animate)
    const time = performance.now() * 0.001

    for (let i = 0; i < nodeCount; i++) {
      const { mesh, material, pointLight } = nodeMeshes[i]
      const baseY = nodePositions[i].y
      
      mesh.position.y = baseY + Math.sin(time * 0.8 + i * 1.2) * 0.12
      mesh.rotation.y = Math.sin(time * 0.4 + i) * 0.08
      mesh.rotation.x = Math.sin(time * 0.3 + i * 0.7) * 0.04

      if (i === activeIndex.value) {
        material.emissiveIntensity = 0.4 + Math.sin(time * 3) * 0.15
        material.opacity = 1.0
        material.color.setHex(0xffe500)
        material.emissive.setHex(0xffe500)
        pointLight.intensity = 1.5 + Math.sin(time * 2) * 0.5
        mesh.scale.setScalar(1 + Math.sin(time * 2) * 0.05)
      } else if (completedNodes.value[i] === true) {
        material.color.setHex(0x22c55e)
        material.emissive.setHex(0x22c55e)
        material.emissiveIntensity = 0.15
        material.opacity = 0.85
        pointLight.intensity = 0.3
        mesh.scale.setScalar(1)
      } else {
        material.color.setHex(0xffe500)
        material.emissive.setHex(0xffe500)
        material.emissiveIntensity = 0.03
        material.opacity = 0.6
        pointLight.intensity = 0
        mesh.scale.setScalar(1)
      }
    }

    const targetY = nodePositions[activeIndex.value].y
    camera.position.y += (targetY - camera.position.y) * 0.03
    camera.lookAt(0, camera.position.y - 1, 0)

    particles.rotation.y += 0.0003
    particles.rotation.x += 0.0001

    if (renderer) {
      renderer.render(scene, camera)
    }
  }

  function init(el: HTMLCanvasElement) {
    renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    handleResize()
    animate()
  }

  function dispose() {
    cancelAnimationFrame(animationId)
    window.removeEventListener('resize', handleResize)
    if (renderer) renderer.dispose()
    scene.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh
        mesh.geometry.dispose()
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose())
        } else {
          mesh.material.dispose()
        }
      }
    })
  }

  watch(canvas, (el) => {
    if (el) {
      init(el)
      window.addEventListener('resize', handleResize)
    }
  }, { immediate: true })

  onUnmounted(dispose)

  return { dispose }
}
