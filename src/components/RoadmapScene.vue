<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThreeScene } from '@/composables/useThreeScene'
import { usePlayerStore } from '@/stores/player'
import { useRoutineStore } from '@/stores/routine'

const emit = defineEmits<{
  openNode: [index: number]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const playerStore = usePlayerStore()
const routineStore = useRoutineStore()

const activeIndex = computed(() => playerStore.activeNodeIndex)
const nodes = computed(() => routineStore.nodes)

useThreeScene({
  canvas: canvasRef,
  activeIndex,
  nodes,
  onNodeClick: (index: number) => {
    emit('openNode', index)
  }
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
  cursor: pointer;
}
</style>
