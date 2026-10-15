<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from 'vue'
import { getLocalDayISO } from '@/lib/date'
import { useRoutineStore } from '@/stores/routine'
import { usePwa } from '@/composables/usePwa'
import RoadmapScene from '@/components/RoadmapScene.vue'
import PlayerControls from '@/components/PlayerControls.vue'
import WorkoutCelebrationModal from '@/components/WorkoutCelebrationModal.vue'

const routineStore = useRoutineStore()
const sidebarWidth = ref(350)
const sidebarPosition = ref<'left' | 'right'>('right')
const isResizing = ref(false)

// ============ RESPONSIVIDADE (MOBILE) ============
// Em telas estreitas (≤ 768px) a sidebar vira um "bottom sheet" abaixo do mapa,
// com dois estados: metade da tela ('half') ou expandida ('full').
const MOBILE_QUERY = '(max-width: 768px)'
const mobileMql = typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY) : null
const isMobile = ref(mobileMql?.matches ?? false)
const sheetState = ref<'half' | 'full'>('half')

function onMobileChange(e: MediaQueryListEvent) {
  isMobile.value = e.matches
}

function toggleSheet() {
  sheetState.value = sheetState.value === 'half' ? 'full' : 'half'
}

// Gesto de arrastar na alça do bottom sheet (swipe ↑ expande, swipe ↓ recolhe)
let sheetTouchStartY = 0
let sheetTouchMoved = false
function onSheetTouchStart(e: TouchEvent) {
  sheetTouchStartY = e.touches[0]?.clientY ?? 0
  sheetTouchMoved = false
}
function onSheetTouchEnd(e: TouchEvent) {
  const endY = e.changedTouches[0]?.clientY ?? sheetTouchStartY
  const dy = endY - sheetTouchStartY
  if (Math.abs(dy) > 30) {
    sheetTouchMoved = true
    sheetState.value = dy < 0 ? 'full' : 'half'
  }
}
function onSheetHandleClick() {
  if (sheetTouchMoved) {
    sheetTouchMoved = false
    return
  }
  toggleSheet()
}

provide('isMobile', isMobile)
provide('sheetState', sheetState)

// ============ PWA: aviso de atualização ============
const { needRefresh, offlineReady, applyUpdate, dismissUpdate } = usePwa()

onMounted(() => {
  const today = getLocalDayISO()
  const lastActiveDate = localStorage.getItem('trilha-canto-last-active')
  
  if (lastActiveDate !== today) {
    routineStore.resetDaily()
    localStorage.setItem('trilha-canto-last-active', today)
  }

  const storedWidth = localStorage.getItem('trilha-canto-sidebar-width')
  if (storedWidth) {
    sidebarWidth.value = parseInt(storedWidth, 10)
  }
  const storedPos = localStorage.getItem('trilha-canto-sidebar-pos')
  if (storedPos === 'left' || storedPos === 'right') {
    sidebarPosition.value = storedPos
  }

  mobileMql?.addEventListener('change', onMobileChange)
})

onUnmounted(() => {
  mobileMql?.removeEventListener('change', onMobileChange)
})

function togglePosition() {
  sidebarPosition.value = sidebarPosition.value === 'right' ? 'left' : 'right'
  localStorage.setItem('trilha-canto-sidebar-pos', sidebarPosition.value)
}

// Provide this to PlayerControls to call it
provide('toggleSidebarPosition', togglePosition)

// Redimensionamento via Pointer Events (funciona com mouse, caneta e toque em tablets)
function startResize(e: PointerEvent) {
  isResizing.value = true
  ;(e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId)
  document.addEventListener('pointermove', onResize)
  document.addEventListener('pointerup', stopResize)
  document.addEventListener('pointercancel', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onResize(e: PointerEvent) {
  if (!isResizing.value) return
  let newWidth = 0
  if (sidebarPosition.value === 'right') {
    newWidth = document.body.clientWidth - e.clientX
  } else {
    newWidth = e.clientX
  }

  if (newWidth > 250 && newWidth < 800) {
    sidebarWidth.value = newWidth
  }
}

function stopResize() {
  isResizing.value = false
  document.removeEventListener('pointermove', onResize)
  document.removeEventListener('pointerup', stopResize)
  document.removeEventListener('pointercancel', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  localStorage.setItem('trilha-canto-sidebar-width', sidebarWidth.value.toString())
}
</script>

<template>
  <div
    class="app-layout"
    :class="{ 'is-mobile': isMobile, 'sheet-full': isMobile && sheetState === 'full' }"
    :style="{ '--sidebar-width': sidebarWidth + 'px', flexDirection: sidebarPosition === 'right' ? 'row' : 'row-reverse' }"
  >
    <div class="main-content">
      <RoadmapScene />
    </div>

    <!-- Drag Resizer -->
    <div class="resizer" @pointerdown="startResize">
      <div class="resizer-handle"></div>
    </div>

    <aside class="sidebar">
      <!-- Alça do bottom sheet (apenas mobile) -->
      <button
        v-if="isMobile"
        type="button"
        class="sheet-handle"
        :aria-label="sheetState === 'half' ? 'Expandir painel' : 'Mostrar mapa'"
        @click="onSheetHandleClick"
        @touchstart.passive="onSheetTouchStart"
        @touchend="onSheetTouchEnd"
      >
        <span class="sheet-grabber"></span>
        <span class="sheet-hint">{{ sheetState === 'half' ? '▲ Expandir painel' : '▼ Ver mapa' }}</span>
      </button>
      <div class="sidebar-scroll">
        <PlayerControls />
      </div>
    </aside>

    <!-- Toast PWA: nova versão / pronto offline -->
    <Transition name="toast">
      <div v-if="needRefresh" class="pwa-toast" role="status">
        <span>🔄 Nova versão disponível</span>
        <div class="pwa-toast-actions">
          <button type="button" class="pwa-toast-btn primary" @click="applyUpdate">Atualizar</button>
          <button type="button" class="pwa-toast-btn" @click="dismissUpdate">Depois</button>
        </div>
      </div>
      <div v-else-if="offlineReady" class="pwa-toast" role="status">
        <span>✅ Pronto para usar offline</span>
      </div>
    </Transition>

    <!-- Modal de Celebração: Treino Concluído -->
    <WorkoutCelebrationModal
      v-if="routineStore.showCompletionCelebration"
      @close="routineStore.dismissCelebration"
    />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  overscroll-behavior: none;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: #f8fafc;
  color: #0f172a;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}

/* Evita zoom automático do iOS ao focar campos com fonte < 16px */
@media (max-width: 768px) and (pointer: coarse) {
  input,
  select,
  textarea,
  [contenteditable='true'] {
    font-size: 16px !important;
  }
}
</style>

<style scoped>
.app-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}

.resizer {
  width: 8px;
  background: #cbd5e1;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  border-left: 2px solid #000;
  border-right: 2px solid #000;
  transition: background 0.2s ease;
  touch-action: none;
}

.resizer:hover {
  background: #fff;
}

.resizer-handle {
  width: 2px;
  height: 24px;
  background: #000;
}

.sidebar {
  width: var(--sidebar-width);
  min-width: 250px;
  max-width: 800px;
  height: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  z-index: 20;
}

.sidebar-scroll {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Tablets: limita a sidebar para não esmagar o mapa */
@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar {
    max-width: 55vw;
  }
}

/* ============ MOBILE: bottom sheet ============ */
@media (max-width: 768px) {
  .app-layout {
    flex-direction: column !important;
  }
  .resizer {
    display: none;
  }
  .main-content {
    flex: 1 1 auto;
  }
  .sidebar {
    width: 100% !important;
    min-width: 0;
    max-width: none;
    flex: 0 0 auto;
    height: 58vh;
    height: 58dvh;
    border-top: 2px solid #000;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.35);
    margin-top: -14px; /* sobrepõe levemente o mapa para o visual de "sheet" */
    overflow: hidden;
    transition: height 0.35s cubic-bezier(0.32, 0.72, 0, 1);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .sheet-full .sidebar {
    height: calc(100vh - 110px);
    height: calc(100dvh - 110px - env(safe-area-inset-top));
  }
}

/* Celulares em paisagem (pouca altura): mantém layout lado a lado */
@media (max-width: 768px) and (orientation: landscape) and (max-height: 500px) {
  .app-layout {
    flex-direction: row !important;
  }
  .sidebar {
    width: 50% !important;
    height: 100% !important;
    margin-top: 0;
    border-top: none;
    border-left: 2px solid #000;
    border-radius: 0;
    padding-bottom: 0;
    padding-right: env(safe-area-inset-right);
  }
  .sheet-handle {
    display: none !important;
  }
}

.sheet-handle {
  flex: 0 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 0 6px;
  background: #ffffff;
  border: none;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  touch-action: none;
}

.sheet-grabber {
  width: 44px;
  height: 5px;
  border-radius: 3px;
  background: #cbd5e1;
}

.sheet-hint {
  font-size: 0.68rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ============ Toast PWA ============ */
.pwa-toast {
  position: fixed;
  left: 50%;
  bottom: calc(16px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 10000;
  background: #0f172a;
  color: #f8fafc;
  border: 1px solid rgba(255, 229, 0, 0.5);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  max-width: calc(100vw - 24px);
  flex-wrap: wrap;
  justify-content: center;
}

.pwa-toast-actions {
  display: flex;
  gap: 8px;
}

.pwa-toast-btn {
  background: transparent;
  color: #f8fafc;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 6px 10px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
}

.pwa-toast-btn.primary {
  background: #ffe500;
  color: #000;
  border-color: #ffe500;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
