<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useRoutineStore } from '@/stores/routine'
import { useMetronomeStore } from '@/stores/metronome'
import gsap from 'gsap'

defineEmits<{
  openNode: [index: number]
}>()

const playerStore = usePlayerStore()
const routineStore = useRoutineStore()
const metronomeStore = useMetronomeStore()

const activeIndex = computed(() => playerStore.activeNodeIndex)
const activeExerciseIndex = computed(() => playerStore.activeExerciseIndex)
const nodes = computed(() => routineStore.nodes)

const containerRef = ref<HTMLElement | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)
const nodeRefs = ref<HTMLElement[]>([])

// Dimensões do container (atualizadas via ResizeObserver)
const containerWidth = ref(0)
const containerHeight = ref(0)

// Modo compacto (celulares / containers estreitos): nós ancorados à esquerda e
// lista de exercícios ocupando a largura restante à direita.
const COMPACT_BREAKPOINT = 640
const isCompact = computed(() => containerWidth.value > 0 && containerWidth.value < COMPACT_BREAKPOINT)

// Layout parameters
const nodeSpacingY = computed(() => (isCompact.value ? 200 : 240)) // Maior distância entre seções
const nodeOffsetX = computed(() => (isCompact.value ? 12 : 60)) // Mais reto (menor que 100)
const nodeSize = computed(() => (isCompact.value ? 60 : 80))
const compactAnchorX = 50 // centro horizontal da trilha no modo compacto (px)
const compactListGap = 12

// Total height of the scrollable roadmap
const totalHeight = computed(() => {
  return 100 + (nodes.value.length - 1) * nodeSpacingY.value + 200
})

// Calculate position for a given node index
const getNodePosition = (index: number) => {
  const x = (index % 2 === 0) ? -nodeOffsetX.value : nodeOffsetX.value
  const y = 100 + index * nodeSpacingY.value
  return { x, y }
}

const trackLeft = computed(() => (isCompact.value ? `${compactAnchorX}px` : '50%'))

const getNodeStyle = (index: number) => {
  const { x, y } = getNodePosition(index)
  return {
    transform: `translate(${x}px, ${y}px)`,
    left: trackLeft.value,
    top: '0',
  }
}

// No modo compacto a lista fica sempre à direita, alinhada numa coluna fixa
const getSideListStyle = (index: number) => {
  if (!isCompact.value) {
    if (!containerWidth.value) return undefined
    return { width: `${Math.max(220, Math.min(350, containerWidth.value / 2 - 90))}px` }
  }
  const { x } = getNodePosition(index)
  const half = nodeSize.value / 2
  const listStart = compactAnchorX + nodeOffsetX.value + half + compactListGap
  const positionerOrigin = compactAnchorX + x - half
  return {
    left: `${listStart - positionerOrigin}px`,
    right: 'auto',
    width: `${Math.max(180, containerWidth.value - listStart - 10)}px`,
    maxHeight: `${Math.max(160, containerHeight.value - 24)}px`,
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

const floatingTweens: gsap.core.Tween[] = []
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  // Animate floating nodes with GSAP
  nextTick(() => {
    nodeRefs.value.forEach((el) => {
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

  // Observa o tamanho do container (janela, sidebar redimensionada, bottom sheet no mobile)
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth
    containerHeight.value = containerRef.value.clientHeight
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (!containerRef.value) return
        containerWidth.value = containerRef.value.clientWidth
        containerHeight.value = containerRef.value.clientHeight
        handleResize()
      })
      resizeObserver.observe(containerRef.value)
    } else {
      window.addEventListener('resize', handleResize)
    }
  }
})

onUnmounted(() => {
  floatingTweens.forEach(t => t.kill())
  resizeObserver?.disconnect()
  window.removeEventListener('resize', handleResize)
})

watch([activeIndex, activeExerciseIndex], ([newNode, newEx]) => {
  if (newNode !== null) centerCamera(newNode, newEx || 0, false)
})

// Ao alternar entre layout normal/compacto, reposiciona a câmera
watch(isCompact, () => {
  nextTick(handleResize)
})

watch(() => metronomeStore.beatTick, () => {
  if (!metronomeStore.isPlaying || activeIndex.value === null) return
  const activeEl = nodeRefs.value[activeIndex.value]
  if (activeEl) {
    const isAcc = metronomeStore.isAccent
    gsap.fromTo(
      activeEl,
      {
        scale: isAcc ? 1.25 : 1.16,
        boxShadow: isAcc ? '0 0 35px rgba(255, 229, 0, 0.95)' : '0 0 25px rgba(56, 189, 248, 0.8)'
      },
      {
        scale: 1.1,
        boxShadow: '0 0 25px rgba(255, 229, 0, 0.5)',
        duration: Math.min(0.35, 30 / metronomeStore.bpm),
        ease: 'power2.out'
      }
    )
  }
})

watch(() => metronomeStore.isPlaying, (playing) => {
  if (!playing && activeIndex.value !== null) {
    const activeEl = nodeRefs.value[activeIndex.value]
    if (activeEl) {
      gsap.to(activeEl, {
        scale: 1.1,
        boxShadow: '0 0 25px rgba(255, 229, 0, 0.5)',
        duration: 0.3
      })
    }
  }
})

const handleResize = () => {
  if (activeIndex.value !== null) centerCamera(activeIndex.value, activeExerciseIndex.value || 0, true)
}

const centerCamera = (nodeIdx: number, exIdx: number, instant = false) => {
  if (!wrapperRef.value || !containerRef.value) return

  // No modo compacto a lista fica centralizada no nó, então não desloca por exercício
  const exerciseOffset = isCompact.value ? 0 : exIdx * 25 // 25px offset per exercise
  const targetY = 100 + nodeIdx * nodeSpacingY.value + exerciseOffset
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
    :class="{ compact: isCompact }"
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

    <!-- Floating Metronome HUD na Cena 3D -->
    <Transition name="hud-pop">
      <div
        v-if="metronomeStore.isPlaying"
        class="scene-metronome-hud"
        @click.stop="metronomeStore.stop()"
        title="Metrônomo ativo — Clique para pausar"
      >
        <div class="hud-pendulum">
          <span class="pendulum-needle" :style="{ animationDuration: `${60 / metronomeStore.bpm}s` }"></span>
        </div>
        <div class="hud-details">
          <div class="hud-tempo-row">
            <span class="hud-bpm-val">{{ metronomeStore.bpm }}</span>
            <span class="hud-bpm-unit">BPM</span>
            <span class="hud-meter-badge">{{ metronomeStore.beatsPerMeasure > 1 ? `${metronomeStore.beatsPerMeasure}/4` : '1/1' }}</span>
          </div>
          <div class="hud-meter-dots">
            <span
              v-for="b in metronomeStore.beatsPerMeasure"
              :key="b"
              class="hud-meter-dot"
              :class="{
                'is-lit': metronomeStore.currentBeat === b,
                'is-accent': b === 1 && metronomeStore.beatsPerMeasure > 1
              }"
            ></span>
          </div>
        </div>
        <button class="hud-stop-icon" @click.stop="metronomeStore.stop()" title="Parar metrônomo">⏹</button>
      </div>
    </Transition>

    <!-- Cenário que se move para simular a câmera -->
    <div class="nodes-wrapper" ref="wrapperRef" :style="{ height: totalHeight + 'px' }">

      <!-- Caminho luminoso -->
      <svg class="roadmap-path" :viewBox="`-300 0 600 ${totalHeight}`" preserveAspectRatio="xMidYMin slice" :style="{ height: totalHeight + 'px', left: trackLeft }">
        <path :d="pathD" stroke="rgba(255, 255, 255, 0.1)" stroke-width="4" fill="none" />
        <path
          v-for="(seg, idx) in pathSegments"
          :key="idx"
          :d="seg.d"
          :stroke="seg.state === 'completed' ? '#22c55e' : (seg.state === 'active' ? '#ffe500' : 'transparent')"
          stroke-width="6"
          fill="none"
          class="glow-line"
          :class="{
            'glow-green': seg.state === 'completed',
            'metronome-path-pulse': metronomeStore.isPlaying && (seg.state === 'active' || seg.state === 'completed')
          }"
        />
      </svg>

      <!-- Nós interativos -->
      <div
        v-for="(node, i) in nodes"
        :key="node.id"
        class="node-positioner"
        :style="getNodeStyle(i)"
      >
        <!-- Ondas sonoras de pulso rítmico do metrônomo -->
        <div v-if="metronomeStore.isPlaying && i === activeIndex" class="metronome-sonar-container">
          <div
            class="metronome-sonar-wave"
            :key="`beat-${metronomeStore.beatTick}`"
            :class="{ 'sonar-accent': metronomeStore.isAccent }"
          ></div>
        </div>

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
            :class="[isCompact ? 'right-side' : (i % 2 === 0 ? 'right-side' : 'left-side'), { 'completed-list': node.completed }]"
            :style="getSideListStyle(i)"
            @click.stop
            @touchstart.stop
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

.completed-list .list-title {
  color: #22c55e;
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

/* Metrônomo: Ondas sonoras (Sonar) */
.metronome-sonar-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 80px;
  height: 80px;
  pointer-events: none;
  z-index: 1;
}

.metronome-sonar-wave {
  position: absolute;
  top: 0;
  left: 0;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid rgba(56, 189, 248, 0.8);
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
  animation: sonar-wave-anim 0.65s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
}

.metronome-sonar-wave.sonar-accent {
  border-color: #ffe500;
  border-width: 3px;
  box-shadow: 0 0 25px rgba(255, 229, 0, 0.85);
}

@keyframes sonar-wave-anim {
  0% {
    transform: scale(0.95);
    opacity: 0.95;
  }
  100% {
    transform: scale(2.6);
    opacity: 0;
  }
}

/* Metrônomo: Pulsação da linha/caminho */
.metronome-path-pulse {
  animation: path-metronome-pulse 1.2s ease-in-out infinite alternate;
}

@keyframes path-metronome-pulse {
  0% {
    stroke-width: 6;
    filter: drop-shadow(0 0 8px rgba(255, 229, 0, 0.5));
  }
  100% {
    stroke-width: 9;
    filter: drop-shadow(0 0 22px rgba(255, 229, 0, 0.9));
  }
}

/* Metrônomo: Floating Scene HUD */
.scene-metronome-hud {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 25;
  background: rgba(8, 8, 22, 0.82);
  border: 1px solid rgba(255, 229, 0, 0.4);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(255, 229, 0, 0.2);
  backdrop-filter: blur(12px);
  border-radius: 30px;
  padding: 8px 16px 8px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.scene-metronome-hud:hover {
  background: rgba(8, 8, 22, 0.95);
  border-color: #ffe500;
  transform: translateY(-2px);
}

.hud-pendulum {
  width: 20px;
  height: 26px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.pendulum-needle {
  width: 2px;
  height: 22px;
  background: #ffe500;
  border-radius: 2px;
  transform-origin: top center;
  animation: pendulum-swing ease-in-out infinite alternate;
  box-shadow: 0 0 8px #ffe500;
}

@keyframes pendulum-swing {
  0% { transform: rotate(-28deg); }
  100% { transform: rotate(28deg); }
}

.hud-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hud-tempo-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.hud-bpm-val {
  font-size: 1.05rem;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.hud-bpm-unit {
  font-size: 0.68rem;
  font-weight: 700;
  color: #ffe500;
}

.hud-meter-badge {
  font-size: 0.65rem;
  font-weight: 600;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.hud-meter-dots {
  display: flex;
  gap: 5px;
}

.hud-meter-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.08s ease;
}

.hud-meter-dot.is-lit {
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
  transform: scale(1.3);
}

.hud-meter-dot.is-lit.is-accent {
  background: #ffe500;
  box-shadow: 0 0 10px #ffe500;
}

.hud-stop-icon {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 50%;
  width: 26px;
  height: 26px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.hud-stop-icon:hover {
  background: #ef4444;
  color: white;
}

.hud-pop-enter-active,
.hud-pop-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hud-pop-enter-from,
.hud-pop-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(0.9);
}

/* ============ MODO COMPACTO (celulares / containers estreitos) ============ */
.compact .node-positioner {
  margin-left: -30px;
  margin-top: -30px;
}

.compact .node-content,
.compact .metronome-sonar-container,
.compact .metronome-sonar-wave {
  width: 60px;
  height: 60px;
}

.compact .node-inner {
  font-size: 18px;
}

.compact .node-title {
  font-size: 11px;
  max-width: 92px;
  padding: 3px 8px;
  margin-top: 8px;
  white-space: normal;
  line-height: 1.2;
}

/* O título do nó ativo já aparece no cabeçalho da lista */
.compact .node-content.active .node-title {
  display: none;
}

.compact .exercise-side-list {
  padding: 12px;
  overflow-y: auto;
  overscroll-behavior: contain;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
}

/* overflow:auto cortaria o conector; no compacto a lista fica colada à trilha */
.compact .right-side::before {
  display: none;
}

.compact .list-title {
  font-size: 0.85rem;
  margin-bottom: 8px;
}

.compact .edit-btn {
  font-size: 1.25rem;
  min-width: 32px;
  min-height: 32px;
}

.compact .side-ex-item {
  padding: 9px 8px;
  font-size: 0.82rem;
}

.compact .scene-metronome-hud {
  top: calc(10px + env(safe-area-inset-top));
  left: auto;
  right: 10px;
  padding: 6px 10px 6px 8px;
  gap: 8px;
}

@media (hover: none) {
  .roadmap-container {
    cursor: default;
  }
}
</style>
