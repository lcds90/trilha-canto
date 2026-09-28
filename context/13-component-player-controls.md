# Contexto 13 — Componente: PlayerControls (Player da Rotina)

> Crie o arquivo `src/components/PlayerControls.vue` usando HTML Nativo Button (unstyled).

## Arquivo: `src/components/PlayerControls.vue`

## Pré-requisitos
- `src/stores/player.ts` (contexto 07)
- `src/stores/routine.ts` (contexto 06)
- `src/stores/streak.ts` (contexto 08)

## HTML Nativo Components Usados

```typescript
import Button from 'primevue/button'
```

## Emits

```typescript
const emit = defineEmits<{
  openNode: [index: number]     // Emitido ao clicar no nome do nó ativo (abre modal)
}>()
```

## Stores Usados

```typescript
const playerStore = usePlayerStore()
const routineStore = useRoutineStore()
const streakStore = useStreakStore()
```

## Computeds

```typescript
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
```

## Funções

```typescript
function finishSession(): void {
  // 1. Coleta IDs dos nós completados:
  //    const completedIds = routineStore.nodes.filter(n => n.completed).map(n => n.id)
  // 2. Registra prática no streak:
  //    streakStore.recordPractice(completedIds, routineStore.totalDuration)
  // 3. Reseta exercícios do dia:
  //    routineStore.resetDaily()
  // 4. Volta ao primeiro nó:
  //    playerStore.goTo(0)
  // 5. Para o player:
  //    playerStore.isPlaying = false
}
```

## Template — Árvore de Elementos

```
div.player-bar
│
├── div.progress-section
│   ├── div.progress-bar-bg
│   │   └── div.progress-bar-fill (:style="{ width: progressPercent + '%' }")
│   └── span.progress-text → "{{ completedCount }}/{{ routineStore.nodes.length }} seções"
│
├── div.player-controls
│   ├── Button @click="playerStore.prev()" :disabled="playerStore.isFirstNode"
│   │   → "⏮"
│   │
│   ├── Button @click="playerStore.togglePlay()" class="play-btn"
│   │   → "{{ playerStore.isPlaying ? '⏸' : '▶' }}"
│   │
│   ├── Button @click="playerStore.next()" :disabled="playerStore.isLastNode"
│   │   → "⏭"
│   │
│   └── label.auto-toggle
│       ├── input[type="checkbox"] v-model="playerStore.autoAdvance"
│       └── span → "Auto"
│
├── div.active-info (@click="emit('openNode', playerStore.activeNodeIndex)")
│   ├── span.active-title → "{{ activeNode.title }}"
│   └── span.active-time → "{{ activeNode.time }}"
│
├── span.duration-display (v-if="totalDurationFormatted")
│   → "⏱️ {{ totalDurationFormatted }}"
│
└── Button.finish-btn (v-if="routineStore.isAllCompleted")
    @click="finishSession"
    → "✅ Concluir Sessão"
```

## CSS

```css
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
```
