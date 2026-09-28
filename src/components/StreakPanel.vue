<script setup lang="ts">
import { computed } from 'vue'
import { useStreakStore } from '@/stores/streak'

const streakStore = useStreakStore()
const todayISO = computed(() => new Date().toISOString().split('T')[0])
</script>

<template>
  <div class="streak-panel">
    <div class="streak-header">
      <span class="flame" :class="{ inactive: streakStore.currentStreak === 0 }">
        {{ streakStore.currentStreak > 0 ? '🔥' : '💤' }}
      </span>
      <span class="streak-count" :class="{ inactive: streakStore.currentStreak === 0 }">
        {{ streakStore.currentStreak }}
      </span>
      <span class="streak-label">dias</span>
    </div>

    <div class="streak-stats">
      <span class="record">Recorde: {{ streakStore.longestStreak }} dias</span>
    </div>

    <div class="calendar-grid">
      <div 
        v-for="day in streakStore.last30Days" 
        :key="day.date"
        class="calendar-day"
        :class="{
          practiced: day.practiced,
          today: day.date === todayISO
        }"
        :title="day.date"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.streak-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

/* Header com flame + número */
.streak-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.flame {
  font-size: 1.5rem;
  animation: flamePulse 1.5s ease-in-out infinite;
}

.flame.inactive {
  opacity: 0.3;
  animation: none;
}

@keyframes flamePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.streak-count {
  font-size: 1.8rem;
  font-weight: 800;
  color: #000;
  line-height: 1;
}

.streak-count.inactive {
  color: #94a3b8;
}

.streak-label {
  font-size: 0.8rem;
  color: #64748b;
  align-self: flex-end;
  margin-bottom: 2px;
}

/* Stats */
.streak-stats {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 600;
}

/* Calendário 30 dias */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);   /* 7 colunas = dias da semana */
  gap: 3px;
}

.calendar-day {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: #f1f5f9;    /* Dia não praticado */
  border: 1px solid #cbd5e1;
  transition: background 0.2s;
}

.calendar-day.practiced {
  background: #22c55e;                       /* Dia praticado - verde */
  border-color: #16a34a;
}

.calendar-day.today {
  outline: 2px solid #000;                /* Hoje - borda preta */
  outline-offset: 1px;
}

.calendar-day:hover {
  transform: scale(1.3);
  cursor: default;
}

@media (max-width: 768px) {
  .streak-panel {
    align-items: center;
  }

  .calendar-grid {
    gap: 2px;
  }

  .calendar-day {
    width: 12px;
    height: 12px;
  }
}
</style>
