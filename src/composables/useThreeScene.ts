import * as THREE from 'three'
import { type Ref, watch, onUnmounted } from 'vue'

export interface Exercise {
  id: string
  name: string
  completed: boolean
}

export interface RoadmapNode {
  id: string
  title: string
  time: string
  exercises: Exercise[]
  completed: boolean
}

interface ThreeSceneOptions {
  canvas: Ref<HTMLCanvasElement | null>
  activeIndex: Ref<number>
  nodes: Ref<RoadmapNode[]>
  onNodeClick: (index: number) => void
}

function createTextTexture(text: string, bgColor: string, textColor: string, width: number, height: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)
  
  ctx.fillStyle = textColor
  ctx.font = 'bold 36px "Inter", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  const words = text.split(' ')
  let line = ''
  const lines = []
  const maxWidth = width - 40
  
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && i > 0) {
      lines.push(line)
      line = words[i] + ' '
    } else {
      line = testLine
    }
  }
  lines.push(line)
  
  const lineHeight = 44
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2
  
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i].trim(), width / 2, startY + i * lineHeight)
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 16
  return texture
}

export function useThreeScene(options: ThreeSceneOptions): {
  dispose: () => void
} {
  const { canvas, activeIndex, nodes, onNodeClick } = options
  let animationId: number
  
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf8fafc) // Light background like roadmap.sh

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  
  let renderer: THREE.WebGLRenderer

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  const nodeMeshes: { mesh: THREE.Mesh, index: number, baseY: number }[] = []
  const exerciseMeshes: { mesh: THREE.Mesh, index: number, exIndex: number, baseY: number }[] = []

  const nodeWidth = 6
  const nodeHeight = 1.5
  const nodeDepth = 0.5
  
  const exWidth = 5
  const exHeight = 1.2
  const exDepth = 0.3

  // Materials
  const mainColor = '#ffe500' // Bright yellow
  const exColor = '#fde047'   // Sand/light yellow
  const completedColor = '#22c55e'
  const textColor = '#000000'
  const lineColor = 0x3b82f6

  // Build the scene
  function buildScene() {
    // Clear previous
    while(scene.children.length > 0){ 
      scene.remove(scene.children[0]) 
    }
    nodeMeshes.length = 0
    exerciseMeshes.length = 0

    const nodesData = nodes.value
    
    const mainBoxGeom = new THREE.BoxGeometry(nodeWidth, nodeHeight, nodeDepth)
    const exBoxGeom = new THREE.BoxGeometry(exWidth, exHeight, exDepth)
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 3 })
    const mainEdgeGeom = new THREE.EdgesGeometry(mainBoxGeom)
    const exEdgeGeom = new THREE.EdgesGeometry(exBoxGeom)

    for (let i = 0; i < nodesData.length; i++) {
      const node = nodesData[i]
      const baseY = -i * 8

      // Main Node
      const bgColor = node.completed ? completedColor : mainColor
      const tex = createTextTexture(node.title, bgColor, textColor, 512, 128)
      const mat = new THREE.MeshBasicMaterial({ map: tex })
      const mesh = new THREE.Mesh(mainBoxGeom, mat)
      mesh.position.set(0, baseY, 0)
      
      const edges = new THREE.LineSegments(mainEdgeGeom, edgeMaterial)
      mesh.add(edges)
      
      mesh.userData = { isMain: true, index: i }
      scene.add(mesh)
      nodeMeshes.push({ mesh, index: i, baseY })

      // Vertical Line
      if (i > 0) {
        const lineMat = new THREE.LineBasicMaterial({ color: lineColor, linewidth: 2 })
        const points = [
          new THREE.Vector3(0, baseY + nodeHeight/2, 0),
          new THREE.Vector3(0, -(i-1)*8 - nodeHeight/2, 0)
        ]
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points)
        const line = new THREE.Line(lineGeom, lineMat)
        scene.add(line)
      }

      // Exercises
      for (let j = 0; j < node.exercises.length; j++) {
        const ex = node.exercises[j]
        const exBaseY = baseY + (j - (node.exercises.length - 1) / 2) * 1.8
        
        const eBgColor = ex.completed ? completedColor : exColor
        const eTex = createTextTexture(ex.name, eBgColor, textColor, 512, 128)
        const eMat = new THREE.MeshBasicMaterial({ map: eTex })
        const eMesh = new THREE.Mesh(exBoxGeom, eMat)
        
        // Right side
        eMesh.position.set(6.5, exBaseY, 0)
        
        const eEdges = new THREE.LineSegments(exEdgeGeom, edgeMaterial)
        eMesh.add(eEdges)
        
        eMesh.userData = { isMain: false, index: i, exIndex: j }
        scene.add(eMesh)
        exerciseMeshes.push({ mesh: eMesh, index: i, exIndex: j, baseY: exBaseY })

        // Dashed connection
        const dashedMat = new THREE.LineDashedMaterial({
          color: lineColor,
          linewidth: 1,
          scale: 1,
          dashSize: 0.2,
          gapSize: 0.2,
        })
        
        // Path: from main node right edge, curved/angled to exercise left edge
        const p1 = new THREE.Vector3(nodeWidth/2, baseY, 0)
        const p2 = new THREE.Vector3(nodeWidth/2 + 1.5, baseY, 0)
        const p3 = new THREE.Vector3(6.5 - exWidth/2 - 1.5, exBaseY, 0)
        const p4 = new THREE.Vector3(6.5 - exWidth/2, exBaseY, 0)
        
        const curve = new THREE.CubicBezierCurve3(p1, p2, p3, p4)
        const curvePoints = curve.getPoints(20)
        const dashedGeom = new THREE.BufferGeometry().setFromPoints(curvePoints)
        const dashedLine = new THREE.Line(dashedGeom, dashedMat)
        dashedLine.computeLineDistances()
        scene.add(dashedLine)
      }
    }
  }

  function handleResize() {
    if (!canvas.value || !renderer) return
    const width = window.innerWidth
    const height = window.innerHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  function onClick(event: MouseEvent) {
    if (!canvas.value) return
    const rect = canvas.value.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    
    // Check all clickable meshes
    const interactables = [...nodeMeshes.map(n => n.mesh), ...exerciseMeshes.map(e => e.mesh)]
    const intersects = raycaster.intersectObjects(interactables)

    if (intersects.length > 0) {
      const obj = intersects[0].object
      if (obj.userData.index !== undefined) {
        onNodeClick(obj.userData.index)
      }
    }
  }

  function animate() {
    animationId = requestAnimationFrame(animate)
    const time = performance.now() * 0.001

    // Animate meshes hovering
    for (const item of nodeMeshes) {
      item.mesh.position.y = item.baseY + Math.sin(time * 2 + item.index) * 0.1
      item.mesh.rotation.y = Math.sin(time * 1 + item.index) * 0.05
      
      // Active highlight scale
      if (item.index === activeIndex.value) {
        item.mesh.scale.setScalar(1 + Math.sin(time * 4) * 0.03)
      } else {
        item.mesh.scale.setScalar(1)
      }
    }

    for (const item of exerciseMeshes) {
      item.mesh.position.y = item.baseY + Math.sin(time * 2.5 + item.exIndex) * 0.08
    }

    // Camera follow
    if (nodes.value.length > 0) {
      const targetY = -activeIndex.value * 8
      camera.position.y += (targetY - camera.position.y) * 0.05
      // Look slightly to the right to frame the side nodes
      camera.position.x = 2
      camera.position.z = 16
      camera.lookAt(2, camera.position.y, 0)
    }

    if (renderer) {
      renderer.render(scene, camera)
    }
  }

  function init(el: HTMLCanvasElement) {
    renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    // White background doesn't need tone mapping like a dark scene
    renderer.toneMapping = THREE.NoToneMapping
    
    buildScene()
    handleResize()
    animate()

    window.addEventListener('click', onClick)
  }

  function dispose() {
    cancelAnimationFrame(animationId)
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('click', onClick)
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

  // Rebuild scene if nodes deeply change (like completion status)
  watch(() => nodes.value, () => {
    buildScene()
  }, { deep: true })

  onUnmounted(dispose)

  return { dispose }
}
