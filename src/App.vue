<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from 'vue'
import { getLocalDayISO } from '@/lib/date'
import { useRoutineStore } from '@/stores/routine'
import RoadmapScene from '@/components/RoadmapScene.vue'
import PlayerControls from '@/components/PlayerControls.vue'

const sidebarWidth = ref(350)
const sidebarPosition = ref<'left' | 'right'>('right')
const isResizing = ref(false)

onMounted(() => {
  const routineStore = useRoutineStore()
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
})

function togglePosition() {
  sidebarPosition.value = sidebarPosition.value === 'right' ? 'left' : 'right'
  localStorage.setItem('trilha-canto-sidebar-pos', sidebarPosition.value)
}

// Provide this to PlayerControls to call it
provide('toggleSidebarPosition', togglePosition)

function startResize(e: MouseEvent) {
  isResizing.value = true
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onResize(e: MouseEvent) {
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
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  localStorage.setItem('trilha-canto-sidebar-width', sidebarWidth.value.toString())
}
</script>

<template>
  <div class="app-layout" :style="{ '--sidebar-width': sidebarWidth + 'px', flexDirection: sidebarPosition === 'right' ? 'row' : 'row-reverse' }">
    <div class="main-content">
      <RoadmapScene />
    </div>

    <!-- Drag Resizer -->
    <div class="resizer" @mousedown="startResize">
      <div class="resizer-handle"></div>
    </div>

    <aside class="sidebar">
      <PlayerControls />
    </aside>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: #f8fafc;
  color: #0f172a;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}
</style>

<style scoped>
.app-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  position: relative;
  overflow: hidden;
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
  height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  z-index: 20;
}

@media (max-width: 768px) {
  .app-layout {
    flex-direction: column !important;
  }
  .resizer {
    display: none;
  }
  .sidebar {
    width: 100% !important;
    height: 50vh; /* Adjust as needed for mobile */
    border-top: 2px solid #000;
  }
}
</style>
