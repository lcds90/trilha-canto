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
  pointer-events: none;
}
</style>
