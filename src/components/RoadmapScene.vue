<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useRoutineStore } from '@/stores/routine'
import gsap from 'gsap'

const emit = defineEmits<{
  openNode: [index: number]
}>()

const playerStore = usePlayerStore()
const routineStore = useRoutineStore()

const activeIndex = computed(() => playerStore.activeNodeIndex)
const activeExerciseIndex = computed(() => playerStore.activeExerciseIndex)
const nodes = computed(() => routineStore.nodes)

const containerRef = ref<HTMLElement | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)
const nodeRefs = ref<HTMLElement[]>([])

// Layout parameters
const nodeSpacingY = 240 // Maior distância entre seções
const nodeOffsetX = 60 // Mais reto (menor que 100)

// Total height of the scrollable roadmap
const totalHeight = computed(() => {
  return 100 + (nodes.value.length - 1) * nodeSpacingY + 200
})

// Calculate position for a given node index
const getNodePosition = (index: number) => {
  const x = (index % 2 === 0) ? -nodeOffsetX : nodeOffsetX
  const y = 100 + index * nodeSpacingY
  return { x, y }
}

const getNodeStyle = (index: number) => {
  const { x, y } = getNodePosition(index)
  return {
    transform: `translate(${x}px, ${y}px)`,
    left: '50%',
    top: '0',
  }
}

// Full path (arredondado com Cubic Bezier)
const pathD = computed(() => {
  if (nodes.value.length === 0) return ''
  let d = ''
  for (let i = 0; i < nodes.value.length; i++) {
    const { x, y } = getNodePosition(i)
    if (i === 0) {
      d += `M ${x} ${y} `
    } else {
      const prev = getNodePosition(i - 1)
      const midY = (prev.y + y) / 2
      d += `C ${prev.x} ${midY}, ${x} ${midY}, ${x} ${y} `
    }
  }
  return d
})

// Segmentos individuais para colorir condicionalmente
const pathSegments = computed(() => {
  const segs = []
  for (let i = 1; i < nodes.value.length; i++) {
    const prev = getNodePosition(i - 1)
    const curr = getNodePosition(i)
    const midY = (prev.y + curr.y) / 2
    const d = `M ${prev.x} ${prev.y} C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`

    let state = 'default'
    if (nodes.value[i]?.completed) {
      state = 'completed' // Verde se a seção foi concluída
    } else if (activeIndex.value !== null && i <= activeIndex.value) {
      state = 'active' // Amarelo se chegou até ela
    }

    segs.push({ d, state })
  }
  return segs
})

// Stars generation
const stars = ref(Array.from({ length: 60 }).map(() => ({
  left: `${Math.random() * 100}vw`,
  top: `${Math.random() * 100}vh`,
  width: `${Math.random() * 3 + 1}px`,
  height: `${Math.random() * 3 + 1}px`,
  animationDuration: `${Math.random() * 3 + 2}s`
})))

let floatingTweens: gsap.core.Tween[] = []

onMounted(() => {
  // Animate floating nodes with GSAP
  nextTick(() => {
    nodeRefs.value.forEach((el, i) => {
      if (!el) return
      const tween = gsap.to(el, {
        y: '+=15',
        rotation: () => (Math.random() - 0.5) * 10,
        duration: 2 + Math.random() * 1.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      })
      floatingTweens.push(tween)
    })

    // Initial camera center
    if (activeIndex.value !== null) centerCamera(activeIndex.value, activeExerciseIndex.value || 0, true)
  })

  // Handle window resize to re-center
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  floatingTweens.forEach(t => t.kill())
  window.removeEventListener('resize', handleResize)
})

watch([activeIndex, activeExerciseIndex], ([newNode, newEx]) => {
  if (newNode !== null) centerCamera(newNode, newEx || 0, false)
})

const handleResize = () => {
  if (activeIndex.value !== null) centerCamera(activeIndex.value, activeExerciseIndex.value || 0, true)
}

const centerCamera = (nodeIdx: number, exIdx: number, instant = false) => {
  if (!wrapperRef.value || !containerRef.value) return

  const exerciseOffset = exIdx * 25 // 25px offset per exercise
  const targetY = 100 + nodeIdx * nodeSpacingY + exerciseOffset
  const windowHalfHeight = (containerRef.value.clientHeight || window.innerHeight) / 2
  const scrollY = windowHalfHeight - targetY

  gsap.to(wrapperRef.value, {
    y: scrollY,
    duration: instant ? 0 : 1.2,
    ease: "power3.inOut"
  })
}

function createParticles(e: MouseEvent, emojis: string[]) {
  for (let i = 0; i < 4; i++) {
    const el = document.createElement('div')
    el.innerText = emojis[Math.floor(Math.random() * emojis.length)]!
    el.style.position = 'fixed'
    el.style.left = e.clientX + 'px'
    el.style.top = e.clientY + 'px'
    el.style.fontSize = '24px'
    el.style.pointerEvents = 'none'
    el.style.zIndex = '9999'
    document.body.appendChild(el)
    gsap.to(el, {
      y: -80 - Math.random() * 80,
      x: (Math.random() - 0.5) * 80,
      opacity: 0,
      scale: 1.5,
      rotation: (Math.random() - 0.5) * 45,
      duration: 1 + Math.random(),
      ease: "power2.out",
      onComplete: () => el.remove()
    })
  }
}

// --- Dragging Logic ---
let isDragging = false
let startY = 0
let startWrapperY = 0

const startDrag = (e: MouseEvent | TouchEvent) => {
  isDragging = true
  if (window.TouchEvent && e instanceof TouchEvent) {
    startY = e.touches[0]?.clientY || 0
  } else {
    startY = (e as MouseEvent).clientY || 0
  }
  startWrapperY = gsap.getProperty(wrapperRef.value, "y") as number
}

const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging || !wrapperRef.value) return
  let currentY = 0
  if (window.TouchEvent && e instanceof TouchEvent) {
    currentY = e.touches[0]?.clientY || 0
  } else {
    currentY = (e as MouseEvent).clientY || 0
  }
  const dy = currentY - startY
  gsap.set(wrapperRef.value, { y: startWrapperY + dy })
}

const endDrag = () => {
  isDragging = false
}

const onNodeClick = (index: number, e: MouseEvent) => {
  playerStore.goTo(index, 0)
  createParticles(e, ['🗣️', '🎤', '✨'])
}
</script>

<template>
  <div
    class="roadmap-container"
    ref="containerRef"
    @mousedown="startDrag"
    @mousemove="onDrag"
    @mouseup="endDrag"
    @mouseleave="endDrag"
    @touchstart="startDrag"
    @touchmove="onDrag"
    @touchend="endDrag"
  >
    <!-- Partículas (Estrelas) -->
    <div class="stars-bg">
      <div v-for="(star, i) in stars" :key="i" class="star" :style="star"></div>
    </div>

    <!-- Cenário que se move para simular a câmera -->
    <div class="nodes-wrapper" ref="wrapperRef" :style="{ height: totalHeight + 'px' }">

      <!-- Caminho luminoso -->
      <svg class="roadmap-path" :viewBox="`-300 0 600 ${totalHeight}`" preserveAspectRatio="xMidYMin slice" :style="{ height: totalHeight + 'px' }">
        <path :d="pathD" stroke="rgba(255, 255, 255, 0.1)" stroke-width="4" fill="none" />
        <path
          v-for="(seg, idx) in pathSegments"
          :key="idx"
          :d="seg.d"
          :stroke="seg.state === 'completed' ? '#22c55e' : (seg.state === 'active' ? '#ffe500' : 'transparent')"
          stroke-width="6"
          fill="none"
          class="glow-line"
          :class="{ 'glow-green': seg.state === 'completed' }"
        />
      </svg>

      <!-- Nós interativos -->
      <div
        v-for="(node, i) in nodes"
        :key="node.id"
        class="node-positioner"
        :style="getNodeStyle(i)"
      >
        <div
          class="node-content"
          ref="nodeRefs"
          :class="{ active: i === activeIndex, completed: node.completed }"
          @click="onNodeClick(i, $event)"
        >
          <div class="node-inner">
            <span v-if="node.completed" class="check-icon">✓</span>
            <span v-else class="index-text">{{ i + 1 }}</span>
          </div>
          <span class="node-title">{{ node.title }}</span>
        </div>

        <!-- Lista lateral de exercícios com Animação -->
        <Transition name="fade-scale">
          <div
            class="exercise-side-list"
            v-if="activeIndex === i"
            :class="[i % 2 === 0 ? 'right-side' : 'left-side', { 'completed-list': node.completed }]"
            @click.stop
          >
            <div class="list-title" >
              <button class="edit-btn" @click="playerStore.editModeNodeId = node.id" title="Editar Seção">⚙️</button>
              <span class="list-title-text">{{ node.title }}</span>
              <span class="section-percent">{{ Math.round((node.exercises.filter(e => e.completed).length / node.exercises.length) * 100) || 0 }}%</span>
              <span class="floating-check">{{ node.completed ? '✅' : '🔘' }}</span>
            </div>
            <ul>
              <li
                v-for="(ex, exIndex) in node.exercises"
                :key="ex.id"
                class="side-ex-item"
                :class="{ 'active-ex': playerStore.activeExerciseIndex === exIndex, 'completed-ex': ex.completed }"
                @click="playerStore.goTo(i, exIndex)"
              >
                <span class="ex-icon" v-if="ex.completed">✓</span>
                <span class="ex-icon" v-else-if="playerStore.activeExerciseIndex === exIndex">▶</span>
                <span class="ex-icon" v-else>•</span>
                <span class="ex-name">{{ ex.name }}</span>
              </li>
            </ul>
          </div>
        </Transition>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Animação do 'modal' (lista lateral) */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-50%) scale(0.8) !important;
}

.roadmap-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #080816;
  overflow: hidden;
  z-index: 0;
  touch-action: none;
  cursor: grab;
}

.roadmap-container:active {
  cursor: grabbing;
}

.stars-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  opacity: 0.4;
  animation: twinkle linear infinite alternate;
}

@keyframes twinkle {
  0% { opacity: 0.1; transform: scale(0.8); }
  100% { opacity: 0.8; transform: scale(1.2); }
}

.nodes-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1;
}

.roadmap-path {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  pointer-events: none;
  z-index: 1;
}

.glow-line {
  filter: drop-shadow(0 0 10px rgba(255, 229, 0, 0.6));
  transition: d 0.5s ease;
}

.glow-green {
  filter: drop-shadow(0 0 10px rgba(34, 197, 94, 0.6));
}

.node-positioner {
  position: absolute;
  z-index: 2;
  margin-left: -40px;
  margin-top: -40px;
}

.node-content {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.4s ease;
  backdrop-filter: blur(8px);
  position: relative;
}

.node-inner {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: bold;
}

.check-icon {
  color: #22c55e;
}

.node-content.active {
  border-color: #ffe500;
  background: rgba(255, 229, 0, 0.1);
  box-shadow: 0 0 25px rgba(255, 229, 0, 0.5);
  transform: scale(1.1);
  z-index: 3;
}
.node-content.active .node-inner {
  color: #ffe500;
}

.node-content.completed {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  box-shadow: 0 0 15px rgba(34, 197, 94, 0.3);
}

.node-content:not(.active):not(.completed) {
  opacity: 0.6;
}

.node-title {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  text-align: center;
  width: max-content;
  max-width: 180px;
  pointer-events: none;
  transition: color 0.3s ease;
  background: rgba(8, 8, 22, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 4px 12px;
  border-radius: 8px;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.node-content.active .node-title {
  opacity: 1;
  color: #ffe500;
  font-weight: bold;
}

.node-content.completed .node-title {
  color: #22c55e;
  opacity: 1;
  font-weight: bold;
}

/* Lista Lateral */
.exercise-side-list {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(8, 8, 22, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  width: 350px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 10;
  pointer-events: auto;
  transform-origin: center center;
}

.right-side {
  left: 120px;
}
.right-side::before {
  content: '';
  position: absolute;
  top: 50%;
  right: 100%;
  width: 40px;
  height: 2px;
  background: rgba(255, 229, 0, 0.5);
  transform: translateY(-50%);
}

.left-side {
  right: 120px;
}
.left-side::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 100%;
  width: 40px;
  height: 2px;
  background: rgba(255, 229, 0, 0.5);
  transform: translateY(-50%);
}

.exercise-side-list.completed-list::before {
  background: rgba(34, 197, 94, 0.8) !important;
}

.list-title {
  color: #ffe500;
  font-weight: 800;
  font-size: 0.95rem;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  padding-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.edit-btn {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0;
  transition: transform 0.2s;
}
.edit-btn:hover {
  transform: scale(1.1) rotate(15deg);
}

.list-title-text {
  flex: 1;
}

.section-percent {
  font-size: 0.8rem;
  background: rgba(255,255,255,0.1);
  padding: 2px 6px;
  border-radius: 4px;
}


.floating-check {
  display: inline-block;
  animation: floatCheck 2s ease-in-out infinite;
}

@keyframes floatCheck {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.side-ex-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  color: #fff;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.side-ex-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

@keyframes popIn {
  0% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.05) translateY(-4px); }
  100% { transform: scale(1) translateY(0); }
}

.active-ex {
  background: rgba(255, 229, 0, 0.15);
  color: #ffe500;
  font-weight: bold;
  border: 1px solid rgba(255, 229, 0, 0.3);
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.completed-ex {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}
.completed-ex.active-ex {
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.ex-icon {
  width: 16px;
  text-align: center;
  font-size: 0.9rem;
}

.ex-name {
  flex: 1;
  line-height: 1.2;
}
</style>
