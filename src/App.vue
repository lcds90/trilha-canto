<script setup lang="ts">
import { ref } from 'vue'
import RoadmapScene from '@/components/RoadmapScene.vue'
import ExerciseModal from '@/components/ExerciseModal.vue'
import PlayerControls from '@/components/PlayerControls.vue'
import StreakPanel from '@/components/StreakPanel.vue'
import { useRoutineStore } from '@/stores/routine'
import { usePlayerStore } from '@/stores/player'

const routineStore = useRoutineStore()
const playerStore = usePlayerStore()
const selectedNodeIndex = ref<number | null>(null)

function openNode(index: number): void {
  playerStore.goTo(index)
  selectedNodeIndex.value = index
}

function closeModal(): void {
  selectedNodeIndex.value = null
}

function completedCountFor(nodeIndex: number): number {
  const node = routineStore.nodes[nodeIndex]
  return node ? node.exercises.filter(e => e.completed).length : 0
}

function exerciseCountFor(nodeIndex: number): number {
  return routineStore.nodes[nodeIndex]?.exercises.length ?? 0
}

function nodeProgressPercent(nodeIndex: number): number {
  const total = exerciseCountFor(nodeIndex)
  if (total === 0) return 0
  return Math.round((completedCountFor(nodeIndex) / total) * 100)
}
</script>

<template>
  <div class="app">
    <!-- 3D Background Canvas -->
    <RoadmapScene />

    <!-- UI Overlay (z-index > canvas) -->
    <div class="overlay">

      <!-- Header -->
      <header class="header">
        <h1 class="app-title">🎵 Trilha de Prática de Canto</h1>
        <StreakPanel />
      </header>

      <!-- Main: Node Cards -->
      <main class="main">
        <div class="nodes-track">
          <div
            v-for="(node, index) in routineStore.nodes"
            :key="node.id"
            class="node-card"
            :class="{
              active: index === playerStore.activeNodeIndex,
              completed: node.completed,
            }"
            @click="openNode(index)"
          >
            <div class="node-header">
              <span class="node-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="node-time">{{ node.time }}</span>
              <span v-if="node.completed" class="node-check">✓</span>
            </div>
            <h2 class="node-title">{{ node.title }}</h2>
            <div class="node-progress">
              <div class="mini-progress-bar">
                <div
                  class="mini-progress-fill"
                  :style="{ width: nodeProgressPercent(index) + '%' }"
                ></div>
              </div>
              <span class="mini-progress-text">
                {{ completedCountFor(index) }}/{{ exerciseCountFor(index) }}
              </span>
            </div>
          </div>
        </div>
      </main>

      <!-- Player Controls (fixed bottom) -->
      <PlayerControls @openNode="openNode" />
    </div>

    <!-- Exercise Modal -->
    <ExerciseModal
      v-if="selectedNodeIndex !== null"
      :nodeIndex="selectedNodeIndex"
      @close="closeModal"
    />
  </div>
</template>

<style>
/* Global Reset and Typography */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: #080816;
  color: #e2e8f0;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
</style>

<style scoped>
.app {
  min-height: 100vh;
}

.overlay {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  pointer-events: none; /* Allows clicking through empty spaces to 3D scene if interactive */
}

/* Make children interactive again */
.header, .main, .player-bar, .modal-overlay {
  pointer-events: auto;
}

/* === Header === */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: #11111a;
  border-bottom: 2px solid #333;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.app-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
}

/* === Main: Node Cards === */
.main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 60px 20px 140px;  /* bottom padding para o player bar */
}

.nodes-track {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 500px;
  width: 100%;
}

/* Node Card (roadmap.sh style) */
.node-card {
  background: #1a1a24;
  border: 2px solid #333;
  border-radius: 12px;
  padding: 20px 24px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  position: relative;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.node-card:hover {
  border-color: #555;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.node-card.active {
  border-color: #ffe500;
  background: #1e1e24;
  box-shadow: 0 0 0 2px rgba(255, 229, 0, 0.2), 0 8px 20px rgba(0, 0, 0, 0.4);
}

.node-card.active::before {
  content: '';
  position: absolute;
  left: -2px;
  top: -2px;
  bottom: -2px;
  width: 6px;
  background: #ffe500;
  border-radius: 10px 0 0 10px;
}

.node-card.completed {
  border-color: #16a34a;
  background: #121c17;
  opacity: 0.9;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.node-index {
  font-size: 0.75rem;
  font-weight: 800;
  color: #000;
  background: #ffe500;
  padding: 4px 10px;
  border-radius: 6px;
}

.node-card.completed .node-index {
  background: #16a34a;
  color: #fff;
}

.node-time {
  font-size: 0.75rem;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.node-check {
  margin-left: auto;
  color: #22c55e;
  font-weight: 800;
  font-size: 1.2rem;
}

.node-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
  letter-spacing: -0.3px;
}

.node-card.completed .node-title {
  text-decoration: line-through;
  color: #a0aec0;
}

/* Mini Progress Bar */
.node-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mini-progress-bar {
  flex: 1;
  height: 6px;
  background: #2a2a35;
  border: 1px solid #333;
  border-radius: 4px;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffe500, #22c55e);
  transition: width 0.4s ease;
}

.mini-progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #a0aec0;
  min-width: 32px;
  text-align: right;
}

/* === Responsive === */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 16px;
    padding: 16px 20px;
    text-align: center;
  }

  .app-title {
    font-size: 1.2rem;
  }

  .main {
    padding: 30px 16px 160px;
  }

  .node-card {
    padding: 16px 20px;
  }
}
</style>
