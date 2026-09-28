<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
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
      <Button @click="playerStore.prev()" :disabled="playerStore.isFirstNode">⏮</Button>
      <Button @click="playerStore.togglePlay()" class="play-btn">
        {{ playerStore.isPlaying ? '⏸' : '▶' }}
      </Button>
      <Button @click="playerStore.next()" :disabled="playerStore.isLastNode">⏭</Button>
      
      <label class="auto-toggle">
        <input type="checkbox" v-model="playerStore.autoAdvance" />
        <span>Auto</span>
      </label>
    </div>

    <div class="active-info" @click="emit('openNode', playerStore.activeNodeIndex)">
      <span class="active-title">{{ activeNode.title }}</span>
      <span class="active-time">{{ activeNode.time }}</span>
    </div>

    <span v-if="totalDurationFormatted" class="duration-display">⏱️ {{ totalDurationFormatted }}</span>

    <Button v-if="routineStore.isAllCompleted" class="finish-btn" @click="finishSession">✅ Concluir Sessão</Button>
  </div>
</template>

<style scoped>
.player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background: rgba(8, 8, 22, 0.9);
  backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255, 229, 0, 0.15);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

/* Barra de progresso */
.progress-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
}

.progress-bar-bg {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffe500, #22c55e);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.7rem;
  color: #94a3b8;
}

/* Controles */
.player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.play-btn {
  width: 44px;
  height: 44px;
  border-radius: 50% !important;
  font-size: 1.2rem;
}

.auto-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #94a3b8;
  cursor: pointer;
}

.auto-toggle input {
  accent-color: #ffe500;
}

/* Info do nó ativo */
.active-info {
  flex: 1;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.active-info:hover {
  background: rgba(255, 229, 0, 0.1);
}

.active-title {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffe500;
}

.active-time {
  font-size: 0.7rem;
  color: #94a3b8;
}

/* Duração total */
.duration-display {
  font-size: 0.8rem;
  color: #94a3b8;
}

/* Botão concluir */
.finish-btn {
  background: rgba(34, 197, 94, 0.2) !important;
  border-color: rgba(34, 197, 94, 0.4) !important;
  color: #22c55e !important;
}

/* Mobile */
@media (max-width: 640px) {
  .player-bar {
    padding: 10px 16px;
    gap: 12px;
  }

  .active-info {
    order: -1;
    flex-basis: 100%;
  }
}
</style>
