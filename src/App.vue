<script setup lang="ts">
import { ref } from 'vue'
import RoadmapScene from '@/components/RoadmapScene.vue'
import ExerciseModal from '@/components/ExerciseModal.vue'
import PlayerControls from '@/components/PlayerControls.vue'
import StreakPanel from '@/components/StreakPanel.vue'
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()
const selectedNodeIndex = ref<number | null>(null)

function openNode(index: number): void {
  playerStore.goTo(index)
  selectedNodeIndex.value = index
}

function closeModal(): void {
  selectedNodeIndex.value = null
}
</script>

<template>
  <div class="app">
    <!-- 3D Canvas handled completely by Three.js -->
    <RoadmapScene @openNode="openNode" />

    <!-- 2D Overlay -->
    <div class="overlay">
      <header class="header">
        <h1 class="app-title">🎤 Trilha de Canto</h1>
        <StreakPanel />
      </header>
      
      <main class="main-empty"></main>

      <PlayerControls @openNode="openNode" />
    </div>

    <!-- Modals -->
    <ExerciseModal
      v-if="selectedNodeIndex !== null"
      :nodeIndex="selectedNodeIndex"
      @close="closeModal"
    />
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
.app {
  width: 100vw;
  height: 100vh;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}

.header, :deep(.player-bar), :deep(.modal-overlay), :deep(.streak-panel) {
  pointer-events: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 2px solid #000;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #000;
  letter-spacing: -0.5px;
}

.main-empty {
  flex: 1;
}

@media (max-width: 640px) {
  .header {
    padding: 12px 16px;
  }
  .app-title {
    font-size: 1.2rem;
  }
}
</style>
