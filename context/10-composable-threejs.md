# Contexto 10 — Composable: useThreeScene (Cena 3D)

> Crie o arquivo `src/composables/useThreeScene.ts` usando Three.js raw (SEM TresJS).

## Arquivo: `src/composables/useThreeScene.ts`

## Pré-requisitos
- Pacote `three` instalado (^0.186)
- Não precisa de `@tresjs/core` nem `@types/three` (tipos incluídos no pacote)

## Propósito
Composable Vue que cria e gerencia toda a cena Three.js: background 3D animado com nós flutuantes em zigzag, caminho luminoso conectando os nós, partículas de fundo, câmera que segue o nó ativo, e feedback visual de conclusão.

## Assinatura

```typescript
import * as THREE from 'three'
import { type Ref, watch, onUnmounted } from 'vue'

interface ThreeSceneOptions {
  canvas: Ref<HTMLCanvasElement | null>   // Ref ao elemento <canvas>
  activeIndex: Ref<number>                // Índice do nó ativo (do playerStore)
  completedNodes: Ref<boolean[]>          // Array de completed para cada nó
  nodeCount: number                       // Total de nós (5)
}

export function useThreeScene(options: ThreeSceneOptions): {
  dispose: () => void
}
```

## Especificação Visual da Cena

### Background e Atmosfera
```
scene.background = new THREE.Color(0x080816)  // Azul escuro quase preto
scene.fog = new THREE.FogExp2(0x080816, 0.015)  // Neblina para profundidade
```

### Posições dos Nós (zigzag)
```
Para i de 0 até (nodeCount - 1):
  x = (i % 2 === 0) ? -3.5 : 3.5          // Alterna esquerda/direita
  y = ((nodeCount - 1) / 2 - i) * 3.5     // Espaçados verticalmente, centro em y=0
  z = 0

Resultado para 5 nós:
  Nó 0: (-3.5,  7.0, 0)  ← esquerda
  Nó 1: ( 3.5,  3.5, 0)  ← direita
  Nó 2: (-3.5,  0.0, 0)  ← esquerda
  Nó 3: ( 3.5, -3.5, 0)  ← direita
  Nó 4: (-3.5, -7.0, 0)  ← esquerda
```

### Câmera
```
type: PerspectiveCamera
fov: 50
near: 0.1, far: 100
posição inicial: (0, nodePositions[0].y, 14)

Movimento suave a cada frame:
  camera.position.y += (targetY - camera.position.y) * 0.03
  camera.lookAt(0, camera.position.y - 1, 0)

targetY = nodePositions[activeIndex].y
```

### Iluminação
```
AmbientLight(0x404080, 0.4)         — luz ambiente azulada suave
DirectionalLight(0xffffff, 0.6)     — luz principal, posição (5, 10, 7)
```

### Renderer
```
WebGLRenderer({ canvas, antialias: true })
setPixelRatio(Math.min(devicePixelRatio, 2))
toneMapping = THREE.ACESFilmicToneMapping
toneMappingExposure = 1.2
```

### Meshes dos Nós (um para cada posição)
```
Geometria: BoxGeometry(2, 1, 0.4, 4, 4, 4)
Material: MeshStandardMaterial({
  color: 0xffe500,
  emissive: 0xffe500,
  emissiveIntensity: 0.05,
  metalness: 0.2,
  roughness: 0.5,
  transparent: true,
  opacity: 0.9,
})

Cada nó também tem um PointLight(0xffe500, 0, 5) na mesma posição para glow dinâmico.
```

### Caminho Conectando os Nós
```
Curva: CatmullRomCurve3(nodePositions, false, 'catmullrom', 0.5)
Geometria: TubeGeometry(curve, 80, 0.06, 8, false)
Material: MeshStandardMaterial({
  color: 0x3b82f6,
  emissive: 0x3b82f6,
  emissiveIntensity: 0.3,
  transparent: true,
  opacity: 0.7,
})
```

### Partículas (Estrelas)
```
Quantidade: 800
Posições aleatórias em cubo:
  x: (random - 0.5) * 50
  y: (random - 0.5) * 50
  z: (random - 0.5) * 30 - 5   (offset para trás)

Material: PointsMaterial({
  color: 0xaaaaff,
  size: 0.08,
  transparent: true,
  opacity: 0.5,
})
```

## Animações (requestAnimationFrame loop)

A cada frame, com `time = performance.now() * 0.001`:

### Animação dos Nós
```
Para cada nó[i]:
  // Flutuação suave
  mesh.position.y = baseY + sin(time * 0.8 + i * 1.2) * 0.12
  mesh.rotation.y = sin(time * 0.4 + i) * 0.08
  mesh.rotation.x = sin(time * 0.3 + i * 0.7) * 0.04

  SE i === activeIndex.value:
    // Nó ATIVO: brilho forte + pulso
    material.emissiveIntensity = 0.4 + sin(time * 3) * 0.15
    material.opacity = 1.0
    material.color = 0xffe500           // Amarelo
    material.emissive = 0xffe500
    pointLight.intensity = 1.5 + sin(time * 2) * 0.5
    mesh.scale.setScalar(1 + sin(time * 2) * 0.05)

  SENÃO SE completedNodes.value[i] === true:
    // Nó COMPLETADO: verde
    material.color.setHex(0x22c55e)
    material.emissive.setHex(0x22c55e)
    material.emissiveIntensity = 0.15
    material.opacity = 0.85
    pointLight.intensity = 0.3
    mesh.scale.setScalar(1)

  SENÃO:
    // Nó INATIVO: amarelo opaco
    material.color.setHex(0xffe500)
    material.emissive.setHex(0xffe500)
    material.emissiveIntensity = 0.03
    material.opacity = 0.6
    pointLight.intensity = 0
    mesh.scale.setScalar(1)
```

### Animação da Câmera
```
const target = nodePositions[activeIndex.value]
camera.position.y += (target.y - camera.position.y) * 0.03   // Lerp suave
camera.lookAt(0, camera.position.y - 1, 0)
```

### Animação das Partículas
```
particles.rotation.y += 0.0003
particles.rotation.x += 0.0001
```

## Resize Handler

```typescript
function handleResize(): void {
  // Atualiza camera.aspect com canvas.clientWidth / clientHeight
  // camera.updateProjectionMatrix()
  // renderer.setSize(canvas.clientWidth, canvas.clientHeight)
}

// addEventListener('resize', handleResize) quando canvas disponível
// removeEventListener('resize', handleResize) no cleanup
```

## Cleanup (onUnmounted)

```typescript
function dispose(): void {
  // 1. cancelAnimationFrame(animationId)
  // 2. window.removeEventListener('resize', handleResize)
  // 3. renderer.dispose()
  // 4. scene.traverse: para cada Mesh, dispose geometry e material
}
```

## Lifecycle

```typescript
watch(canvas, (el) => {
  if (el) {
    init(el)
    window.addEventListener('resize', handleResize)
  }
}, { immediate: true })

onUnmounted(dispose)
```
