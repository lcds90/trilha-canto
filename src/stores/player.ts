import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useRoutineStore } from './routine'

export const usePlayerStore = defineStore('player', () => {
  const routineStore = useRoutineStore()

  // ============ STATE ============
  const activeNodeIndex = ref(0)
  const isPlaying = ref(false)
  const autoAdvance = ref(true)

  // ============ GETTERS ============
  const activeNode = computed(() => routineStore.nodes[activeNodeIndex.value])
  const isFirstNode = computed(() => activeNodeIndex.value === 0)
  const isLastNode = computed(() => activeNodeIndex.value === routineStore.nodes.length - 1)
  const progressPercent = computed(() => {
    const completed = routineStore.nodes.filter(n => n.completed).length
    return Math.round((completed / routineStore.nodes.length) * 100)
  })

  // ============ ACTIONS ============
  function next(): void {
    if (!isLastNode.value) {
      activeNodeIndex.value++
    }
  }

  function prev(): void {
    if (!isFirstNode.value) {
      activeNodeIndex.value--
    }
  }

  function togglePlay(): void {
    isPlaying.value = !isPlaying.value
  }

  function goTo(index: number): void {
    if (index >= 0 && index < routineStore.nodes.length) {
      activeNodeIndex.value = index
    }
  }

  // ============ WATCHER (auto-advance) ============
  watch(
    () => routineStore.nodes[activeNodeIndex.value]?.completed,
    (completed) => {
      if (completed && autoAdvance.value && isPlaying.value && !isLastNode.value) {
        setTimeout(() => {
          next()
        }, 1500)
      }
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
