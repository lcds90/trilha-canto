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
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #080816;
  color: #e2e8f0;
  overflow-x: hidden;
}

/* PrimeVue Unstyled — Estilos base dos componentes */

.p-dialog-mask {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.p-dialog {
  background: rgba(20, 20, 45, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 229, 0, 0.2);
  border-radius: 20px;
  color: #e2e8f0;
  width: 90vw;
  max-width: 560px;
  max-height: 85vh;
  overflow-y: auto;
}

.p-dialog-header {
  padding: 20px 24px 12px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffe500;
  border-bottom: 1px solid rgba(255, 229, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.p-dialog-content {
  padding: 16px 24px 24px;
}

.p-dialog-header-actions {
  display: flex;
}

.p-button {
  background: rgba(255, 229, 0, 0.15);
  border: 1px solid rgba(255, 229, 0, 0.3);
  color: #ffe500;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.p-button:hover:not(:disabled) {
  background: rgba(255, 229, 0, 0.25);
  border-color: rgba(255, 229, 0, 0.5);
}

.p-button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.p-inputtext {
  background: rgba(20, 20, 40, 0.8);
  border: 1px solid rgba(255, 229, 0, 0.15);
  color: #e2e8f0;
  padding: 10px 14px;
  border-radius: 8px;
  width: 100%;
  outline: none;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.p-inputtext:focus {
  border-color: #ffe500;
}

.p-inputtext::placeholder {
  color: #475569;
}

.p-checkbox {
  width: 22px;
  height: 22px;
  cursor: pointer;
}

.p-checkbox-box {
  width: 22px;
  height: 22px;
  border: 2px solid rgba(255, 229, 0, 0.3);
  border-radius: 6px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.p-checkbox-box.p-highlight,
.p-checkbox.p-checked .p-checkbox-box {
  background: #22c55e;
  border-color: #22c55e;
}

.p-checkbox-icon {
  color: white;
  font-size: 12px;
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
}

/* === Header === */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: rgba(8, 8, 22, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 229, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
}

.app-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #e2e8f0;
}

/* === Main: Node Cards === */
.main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 40px 20px 120px;  /* bottom padding para o player bar */
}

.nodes-track {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 480px;
  width: 100%;
}

/* Node Card */
.node-card {
  background: rgba(30, 30, 60, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 229, 0, 0.12);
  border-radius: 16px;
  padding: 18px 22px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.node-card:hover {
  border-color: rgba(255, 229, 0, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.node-card.active {
  border-color: #ffe500;
  background: rgba(255, 229, 0, 0.06);
  box-shadow: 0 0 30px rgba(255, 229, 0, 0.12);
}

.node-card.completed {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.04);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.node-index {
  font-size: 0.7rem;
  font-weight: 700;
  color: #ffe500;
  background: rgba(255, 229, 0, 0.15);
  padding: 2px 8px;
  border-radius: 6px;
}

.node-time {
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.node-check {
  margin-left: auto;
  color: #22c55e;
  font-weight: 700;
  font-size: 1.1rem;
}

.node-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 10px;
}

.node-card.completed .node-title {
  text-decoration: line-through;
  opacity: 0.6;
}

/* Mini Progress Bar */
.node-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mini-progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffe500, #22c55e);
  border-radius: 2px;
  transition: width 0.4s ease;
}

.mini-progress-text {
  font-size: 0.7rem;
  color: #64748b;
  min-width: 28px;
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
    padding: 24px 16px 100px;
  }

  .node-card {
    padding: 14px 16px;
  }
}
</style>
