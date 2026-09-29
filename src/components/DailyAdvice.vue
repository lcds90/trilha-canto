<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { getDailyAdvice } from '@/lib/dailyAdvice'
import { useStreakStore } from '@/stores/streak'
import { useRoutineStore } from '@/stores/routine'
import { usePlayerStore } from '@/stores/player'

const streakStore = useStreakStore()
const routineStore = useRoutineStore()
const playerStore = usePlayerStore()

const advice = ref<string>('Buscando conselho do amigo...')
const loading = ref(true)

async function fetchAdvice() {
  loading.value = true
  try {
    const node = playerStore.activeNode || null
    const todayCompleted = routineStore.isAllCompleted
    const streak = streakStore.currentStreak
    
    advice.value = await getDailyAdvice(node, streak, todayCompleted)
  } catch (err) {
    advice.value = 'Aqueça a voz, beba água e vamos começar a prática!'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAdvice()
})

watch(() => playerStore.activeNodeIndex, () => {
  fetchAdvice()
})
</script>

<template>
  <div class="daily-advice-card">
    <div class="advice-header">
      <span class="advice-icon">🫶🏽</span>
      <span class="advice-title">Conselho do amigo</span>
    </div>
    <div class="advice-body" :class="{ 'is-loading': loading }">
      {{ advice }}
    </div>
  </div>
</template>

<style scoped>
.daily-advice-card {
  background: linear-gradient(145deg, #f8fafc, #f1f5f9);
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  flex: 1;
  margin-right: 12px;
}

.advice-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.advice-icon {
  font-size: 1.5rem;
}

.advice-title {
  font-weight: 800;
  font-size: 1.05rem;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.advice-body {
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.5;
  font-weight: 500;
  transition: opacity 0.3s;
}

.advice-body.is-loading {
  opacity: 0.5;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}
</style>
