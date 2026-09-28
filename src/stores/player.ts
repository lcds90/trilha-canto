import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useRoutineStore } from './routine'

export const usePlayerStore = defineStore('player', () => {
  const routineStore = useRoutineStore()

  // ============ STATE ============
  const activeNodeIndex = ref(0)
  const activeExerciseIndex = ref(0)
  const isPlaying = ref(false)
  const autoAdvance = ref(true)
  const editModeNodeId = ref<string | null>(null)

  // ============ GETTERS ============
  const activeNode = computed(() => routineStore.nodes[activeNodeIndex.value])
  const activeExercise = computed(() => activeNode.value?.exercises[activeExerciseIndex.value])
  const isFirstNode = computed(() => activeNodeIndex.value === 0)
  const isLastNode = computed(() => activeNodeIndex.value === routineStore.nodes.length - 1)
  
  const isFirstExercise = computed(() => isFirstNode.value && activeExerciseIndex.value === 0)
  const isLastExercise = computed(() => isLastNode.value && activeExerciseIndex.value === (activeNode.value?.exercises.length ?? 1) - 1)

  const progressPercent = computed(() => {
    let totalExercises = 0
    let completedExercises = 0
    routineStore.nodes.forEach(n => {
      totalExercises += n.exercises.length
      completedExercises += n.exercises.filter(e => e.completed).length
    })
    return totalExercises === 0 ? 0 : Math.round((completedExercises / totalExercises) * 100)
  })

  // ============ ACTIONS ============
  function next(): void {
    if (!activeNode.value) return
    if (activeExerciseIndex.value < activeNode.value.exercises.length - 1) {
      activeExerciseIndex.value++
    } else if (!isLastNode.value) {
      activeNodeIndex.value++
      activeExerciseIndex.value = 0
    }
  }

  function prev(): void {
    if (activeExerciseIndex.value > 0) {
      activeExerciseIndex.value--
    } else if (!isFirstNode.value) {
      activeNodeIndex.value--
      activeExerciseIndex.value = routineStore.nodes[activeNodeIndex.value]!.exercises.length - 1
    }
  }

  function togglePlay(): void {
    isPlaying.value = !isPlaying.value
  }

  function goTo(nodeIndex: number, exerciseIndex: number = 0): void {
    if (nodeIndex >= 0 && nodeIndex < routineStore.nodes.length) {
      activeNodeIndex.value = nodeIndex
      const node = routineStore.nodes[nodeIndex]!
      if (exerciseIndex >= 0 && exerciseIndex < node.exercises.length) {
        activeExerciseIndex.value = exerciseIndex
      } else {
        activeExerciseIndex.value = 0
      }
    }
  }

  // ============ WATCHER (auto-advance) ============
  watch(
    () => activeExercise.value?.completed,
    (completed) => {
      if (completed && autoAdvance.value && isPlaying.value && !isLastExercise.value) {
        setTimeout(() => {
          next()
        }, 1500)
      }
    },
  )

  return {
    activeNodeIndex,
    activeExerciseIndex,
    activeExercise,
    isPlaying,
    autoAdvance,
    editModeNodeId,
    activeNode,
    isFirstNode,
    isLastNode,
    isFirstExercise,
    isLastExercise,
    progressPercent,
    next,
    prev,
    togglePlay,
    goTo,
  }
})
