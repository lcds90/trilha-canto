import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useRoutineStore } from './routine'

export const usePlayerStore = defineStore('player', () => {
  const routineStore = useRoutineStore()

  // ============ STATE ============
  const activeNodeIndex = ref<number | null>(null)
  const activeExerciseIndex = ref<number | null>(null)
  const activeVideoIndex = ref(0)
  const isPlaying = ref(false)
  const autoAdvance = ref(true)
  const editModeNodeId = ref<string | null>(null)
  const videoVolume = ref(100)

  // ============ GETTERS ============
  const activeNode = computed(() => activeNodeIndex.value !== null ? routineStore.nodes[activeNodeIndex.value] : null)
  const activeExercise = computed(() => activeNode.value && activeExerciseIndex.value !== null ? activeNode.value.exercises[activeExerciseIndex.value] : null)
  
  const currentVideo = computed(() => {
    const vids = activeExercise.value?.videos || []
    if (vids.length > 0 && activeVideoIndex.value < vids.length) {
      return vids[activeVideoIndex.value]
    }
    return null
  })

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
    if (!activeNode.value || activeNodeIndex.value === null || activeExerciseIndex.value === null) return
    const vids = activeExercise.value?.videos || []
    if (vids.length > 1 && activeVideoIndex.value < vids.length - 1) {
      activeVideoIndex.value++
    } else if (activeExerciseIndex.value < activeNode.value.exercises.length - 1) {
      activeExerciseIndex.value++
      activeVideoIndex.value = 0
    } else if (!isLastNode.value) {
      activeNodeIndex.value++
      activeExerciseIndex.value = 0
      activeVideoIndex.value = 0
    }
  }

  function prev(): void {
    if (activeNodeIndex.value === null || activeExerciseIndex.value === null) return
    const vids = activeExercise.value?.videos || []
    if (vids.length > 1 && activeVideoIndex.value > 0) {
      activeVideoIndex.value--
    } else if (activeExerciseIndex.value > 0) {
      activeExerciseIndex.value--
      activeVideoIndex.value = 0
    } else if (!isFirstNode.value) {
      activeNodeIndex.value--
      activeExerciseIndex.value = routineStore.nodes[activeNodeIndex.value]!.exercises.length - 1
      activeVideoIndex.value = 0
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
      activeVideoIndex.value = 0
    }
  }

  function setVideoVolume(vol: number) {
    videoVolume.value = vol
  }

  // Se mudar o exercício, zerar o índice do vídeo
  watch(activeExercise, () => {
    activeVideoIndex.value = 0
  })

  // Retiramos o watch de auto-advance baseado em `.completed` puramente,
  // pois queremos ter o controle no componente de vídeo que sabe 
  // se estava tocando ou não. Vamos deixar a UI acionar.
  // ============ URL SYNC ============
  function syncStateToUrl() {
    const params = new URLSearchParams(window.location.search)
    if (activeNodeIndex.value !== null) {
      params.set('section', (activeNodeIndex.value + 1).toString())
    } else {
      params.delete('section')
    }
    if (activeExerciseIndex.value !== null) {
      params.set('exercise', (activeExerciseIndex.value + 1).toString())
    } else {
      params.delete('exercise')
    }
    if (editModeNodeId.value) {
      params.set('isEdit', 'true')
    } else {
      params.delete('isEdit')
    }
    const newUrl = window.location.pathname + '?' + params.toString()
    window.history.replaceState({}, '', newUrl)
  }

  function loadStateFromUrl() {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const sectionParam = params.get('section')
    const exerciseParam = params.get('exercise')
    const isEditParam = params.get('isEdit')

    if (sectionParam) {
      const parsedSection = parseInt(sectionParam, 10) - 1
      if (!isNaN(parsedSection) && parsedSection >= 0 && parsedSection < routineStore.nodes.length) {
        activeNodeIndex.value = parsedSection
      }
    }
    if (exerciseParam && activeNodeIndex.value !== null) {
      const parsedExercise = parseInt(exerciseParam, 10) - 1
      const node = routineStore.nodes[activeNodeIndex.value]
      if (node && !isNaN(parsedExercise) && parsedExercise >= 0 && parsedExercise < node.exercises.length) {
        activeExerciseIndex.value = parsedExercise
      }
    } else if (activeNodeIndex.value !== null) {
      activeExerciseIndex.value = 0
    }
    
    if (isEditParam === 'true' && activeNodeIndex.value !== null) {
      editModeNodeId.value = routineStore.nodes[activeNodeIndex.value]?.id || null
    }
  }

  loadStateFromUrl()

  watch([activeNodeIndex, activeExerciseIndex, editModeNodeId], () => {
    syncStateToUrl()
  })

  return {
    activeNodeIndex,
    activeExerciseIndex,
    activeVideoIndex,
    activeExercise,
    currentVideo,
    isPlaying,
    autoAdvance,
    editModeNodeId,
    activeNode,
    isFirstNode,
    isLastNode,
    isFirstExercise,
    isLastExercise,
    progressPercent,
    videoVolume,
    next,
    prev,
    togglePlay,
    goTo,
    setVideoVolume
  }
})
