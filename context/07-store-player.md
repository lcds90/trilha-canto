# Contexto 07 — Store: Player

> Crie o arquivo `src/stores/player.ts` usando Pinia Composition API.

## Arquivo: `src/stores/player.ts`

## Pré-requisitos
- `src/stores/routine.ts` criado (contexto 06)
- `src/types/index.ts` criado (contexto 03)

## Propósito
Controla a navegação entre os nós do roadmap: qual nó está ativo, se a rotina está "em execução" (playing), e auto-advance (avança automaticamente ao completar uma seção).

## Especificação Completa

```typescript
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useRoutineStore } from './routine'

export const usePlayerStore = defineStore('player', () => {
  const routineStore = useRoutineStore()

  // ============ STATE ============

  const activeNodeIndex = ref(0)     // 0-based, qual nó está focado
  const isPlaying = ref(false)       // se a rotina está "em execução"
  const autoAdvance = ref(true)      // avança automaticamente ao completar seção

  // ============ GETTERS ============

  const activeNode = computed(() => routineStore.nodes[activeNodeIndex.value])
    // O RoadmapNode atualmente ativo (pode ser undefined se index inválido)

  const isFirstNode = computed(() => activeNodeIndex.value === 0)

  const isLastNode = computed(() => activeNodeIndex.value === routineStore.nodes.length - 1)

  const progressPercent = computed(() => {
    // Percentual de nós completados
    // const completed = routineStore.nodes.filter(n => n.completed).length
    // return Math.round((completed / routineStore.nodes.length) * 100)
  })

  // ============ ACTIONS ============

  function next(): void {
    // Se NÃO é o último nó → activeNodeIndex++
  }

  function prev(): void {
    // Se NÃO é o primeiro nó → activeNodeIndex--
  }

  function togglePlay(): void {
    // isPlaying = !isPlaying
  }

  function goTo(index: number): void {
    // Se 0 <= index < nodes.length → activeNodeIndex = index
  }

  // ============ WATCHER (auto-advance) ============

  watch(
    () => routineStore.nodes[activeNodeIndex.value]?.completed,
    (completed) => {
      // Se o nó ativo acabou de ser completado:
      // E autoAdvance está ligado
      // E isPlaying está ligado
      // E NÃO é o último nó
      // → Aguarda 1500ms e chama next()
      //
      // Usar setTimeout com 1500ms de delay para dar feedback visual
      // antes de avançar
    },
  )

  return {
    activeNodeIndex,
    isPlaying,
    autoAdvance,
    activeNode,
    isFirstNode,
    isLastNode,
    progressPercent,
    next,
    prev,
    togglePlay,
    goTo,
  }
})
```

## Como é usada

```typescript
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()

playerStore.activeNodeIndex   // 0
playerStore.activeNode        // RoadmapNode (o nó ativo)
playerStore.isPlaying         // false
playerStore.progressPercent   // 0

playerStore.next()            // Avança para o próximo nó
playerStore.prev()            // Volta ao nó anterior
playerStore.togglePlay()      // Liga/desliga "em execução"
playerStore.goTo(2)           // Vai direto para o nó de índice 2
```

## Comportamento do Auto-Advance

Sequência quando o usuário marca o último exercício de uma seção:

1. `routine.toggleExercise()` marca o exercício ✓
2. `routine` recalcula `node.completed = true`
3. O watcher no player detecta `completed === true`
4. Verifica: `autoAdvance && isPlaying && !isLastNode`
5. Se tudo true → `setTimeout(() => next(), 1500)`
6. Após 1.5s → camera 3D anima para o próximo nó
