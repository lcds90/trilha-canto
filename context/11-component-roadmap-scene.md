# Contexto 11 — Componente: RoadmapScene (Canvas 3D)

> Crie o arquivo `src/components/RoadmapScene.vue`.

## Arquivo: `src/components/RoadmapScene.vue`

## Pré-requisitos
- `src/composables/useThreeScene.ts` criado (contexto 10)
- `src/stores/player.ts` criado (contexto 07)
- `src/stores/routine.ts` criado (contexto 06)

## Propósito
Wrapper simples que monta o `<canvas>` HTML e passa as refs reativas para o composable `useThreeScene`. O canvas fica como background fixo da aplicação inteira.

## Código Completo

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThreeScene } from '@/composables/useThreeScene'
import { usePlayerStore } from '@/stores/player'
import { useRoutineStore } from '@/stores/routine'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const playerStore = usePlayerStore()
const routineStore = useRoutineStore()

const activeIndex = computed(() => playerStore.activeNodeIndex)
const completedNodes = computed(() => routineStore.nodes.map(n => n.completed))

useThreeScene({
  canvas: canvasRef,
  activeIndex,
  completedNodes,
  nodeCount: routineStore.nodes.length,
})
</script>

<template>
  <canvas ref="canvasRef" class="three-canvas" />
</template>

<style scoped>
.three-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;   /* Não intercepta cliques — a UI HTML fica por cima */
}
</style>
```

## Notas
- O canvas é `position: fixed` e ocupa a tela inteira
- `pointer-events: none` garante que cliques passam para a UI HTML acima
- `z-index: 0` — todos os outros elementos da UI devem ter `z-index >= 1`
- O canvas é reativo: quando `activeNodeIndex` muda (player) ou nós são completados (routine), a cena 3D anima automaticamente
