<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useRoutineStore } from '@/stores/routine'
import { useStreakStore } from '@/stores/streak'

const emit = defineEmits<{
  openNode: [index: number]
}>()

const playerStore = usePlayerStore()
const routineStore = useRoutineStore()
const streakStore = useStreakStore()

const activeNode = computed(() => routineStore.nodes[playerStore.activeNodeIndex]!)

const progressPercent = computed(() => {
  const completed = routineStore.nodes.filter(n => n.completed).length
  return Math.round((completed / routineStore.nodes.length) * 100)
})

const completedCount = computed(() =>
  routineStore.nodes.filter(n => n.completed).length
)

const totalDurationFormatted = computed(() => {
  const total = routineStore.totalDuration
  if (total === 0) return null
  const min = Math.floor(total / 60)
  const sec = total % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
})

function finishSession(): void {
  const completedIds = routineStore.nodes.filter(n => n.completed).map(n => n.id)
  streakStore.recordPractice(completedIds, routineStore.totalDuration)
  routineStore.resetDaily()
  playerStore.goTo(0)
  playerStore.isPlaying = false
}
</script>

<template>
  <div class="player-bar">
    <div class="progress-section">
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <span class="progress-text">{{ completedCount }}/{{ routineStore.nodes.length }} seções</span>
    </div>

    <div class="player-controls">
      <button class="icon-btn" @click="playerStore.prev()" :disabled="playerStore.isFirstNode">⏮</button>
      <button class="icon-btn play-btn" @click="playerStore.togglePlay()">
        {{ playerStore.isPlaying ? '⏸' : '▶' }}
      </button>
      <button class="icon-btn" @click="playerStore.next()" :disabled="playerStore.isLastNode">⏭</button>
      
      <label class="auto-toggle">
        <input type="checkbox" class="native-checkbox" v-model="playerStore.autoAdvance" />
        <span>Auto</span>
      </label>
    </div>

    <div class="active-info" @click="emit('openNode', playerStore.activeNodeIndex)">
      <span class="active-title">{{ activeNode.title }}</span>
      <span class="active-time">{{ activeNode.time }}</span>
    </div>

    <span v-if="totalDurationFormatted" class="duration-display">⏱️ {{ totalDurationFormatted }}</span>

    <button v-if="routineStore.isAllCompleted" class="finish-btn" @click="finishSession">✅ Concluir Sessão</button>
  </div>
</template>

<style scoped>
.player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background: #ffffff;
  border-top: 2px solid #000;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

/* Barra de progresso */
.progress-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
}

.progress-bar-bg {
  height: 8px;
  background: #f1f5f9;
  border: 2px solid #000;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffe500, #22c55e);
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #334155;
  font-weight: 700;
}

/* Controles */
.player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  background: #ffffff;
  border: 2px solid #000;
  color: #000;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #ffe500;
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.play-btn {
  background: #ffe500;
  color: #000;
  border-color: #000;
  width: 48px;
  height: 48px;
  font-size: 1.2rem;
  border-radius: 50%;
}

.play-btn:hover:not(:disabled) {
  background: #ffec33;
}

.auto-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #000;
  font-weight: 700;
  cursor: pointer;
  margin-left: 8px;
}

.native-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #ffe500;
  cursor: pointer;
}

/* Info do nó ativo */
.active-info {
  flex: 1;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  background: #ffffff;
  border: 2px solid #000;
  transition: all 0.2s;
}

.active-info:hover {
  background: #fffb00;
}

.active-title {
  display: block;
  font-size: 0.95rem;
  font-weight: 800;
  color: #000;
}

.active-time {
  font-size: 0.75rem;
  color: #475569;
  font-weight: 600;
}

/* Duração total */
.duration-display {
  font-size: 0.85rem;
  color: #334155;
  font-weight: 700;
}

/* Botão concluir */
.finish-btn {
  background: #22c55e;
  color: #000;
  border: 2px solid #000;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.finish-btn:hover {
  background: #4ade80;
}

/* Mobile */
@media (max-width: 640px) {
  .player-bar {
    padding: 12px 16px;
    gap: 12px;
  }

  .active-info {
    order: -1;
    flex-basis: 100%;
  }
}
</style>
