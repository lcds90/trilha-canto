# Contexto 14 — Componente: StreakPanel (Ofensiva e Histórico)

> Crie o arquivo `src/components/StreakPanel.vue`.

## Arquivo: `src/components/StreakPanel.vue`

## Pré-requisitos
- `src/stores/streak.ts` (contexto 08)

## Propósito
Painel compacto no header que exibe:
- Ofensiva atual (dias consecutivos) com emoji de fogo 🔥
- Recorde de streak
- Calendário visual dos últimos 30 dias (grid de quadrados coloridos)

## Store Usado

```typescript
import { useStreakStore } from '@/stores/streak'

const streakStore = useStreakStore()
```

## Computeds

```typescript
import { getLocalDayISO } from '@/lib/date'
const todayISO = computed(() => getLocalDayISO())
```

## Template — Árvore de Elementos

```
div.streak-panel
│
├── div.streak-header
│   ├── span.flame → "🔥"
│   ├── span.streak-count → "{{ streakStore.currentStreak }}"
│   └── span.streak-label → "dias"
│
├── div.streak-stats
│   └── span.record → "Recorde: {{ streakStore.longestStreak }} dias"
│
└── div.calendar-grid
    └── div.calendar-day (v-for="day in streakStore.last30Days" :key="day.date")
        [:class="{
          practiced: day.practiced,
          today: day.date === todayISO
        }"]
        :title="day.date"
```

## CSS

```css
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
  /* Animação sutil de pulso */
  animation: flamePulse 1.5s ease-in-out infinite;
}

@keyframes flamePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.streak-count {
  font-size: 1.8rem;
  font-weight: 800;
  color: #ffe500;
  line-height: 1;
}

.streak-label {
  font-size: 0.8rem;
  color: #94a3b8;
  align-self: flex-end;
  margin-bottom: 2px;
}

/* Stats */
.streak-stats {
  font-size: 0.7rem;
  color: #64748b;
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
  background: rgba(255, 255, 255, 0.06);    /* Dia não praticado */
  transition: background 0.2s;
}

.calendar-day.practiced {
  background: #22c55e;                       /* Dia praticado - verde */
}

/* Intensidade variável (opcional — pode usar classes practiced-1, practiced-2, etc.) */

.calendar-day.today {
  outline: 2px solid #ffe500;                /* Hoje - borda amarela */
  outline-offset: 1px;
}

.calendar-day:hover {
  transform: scale(1.3);
  cursor: default;
}
```

## Variação para Streak === 0

Quando `currentStreak === 0`:
- O emoji de fogo pode ficar com `opacity: 0.3` ou usar "💤" no lugar
- A cor do `streak-count` pode ser `#64748b` (cinza) em vez de amarelo

```css
.flame.inactive {
  opacity: 0.3;
  animation: none;
}

.streak-count.inactive {
  color: #64748b;
}
```

No template:
```html
<span class="flame" :class="{ inactive: streakStore.currentStreak === 0 }">
  {{ streakStore.currentStreak > 0 ? '🔥' : '💤' }}
</span>
<span class="streak-count" :class="{ inactive: streakStore.currentStreak === 0 }">
  {{ streakStore.currentStreak }}
</span>
```

## Responsividade

Em telas pequenas, o painel fica abaixo do título (controlado pelo CSS do header no App.vue):

```css
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
```
