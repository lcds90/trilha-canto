import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { RoadmapNode } from '@/types'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { getLocalDayISO } from '@/lib/date'

const STORAGE_KEY = 'trilha-canto-routine'

const DEFAULT_NODES: RoadmapNode[] = [
  {
    id: 'respiracao',
    title: 'Respiração e Suporte',
    time: 'Tempo flexível',
    color: '#ffe500',
    exercises: [
      { id: 'resp-1', name: 'Inspiração e expiração livres', videos: [], completed: false },
      { id: 'resp-2', name: "Sons de 's' em staccato", videos: [], completed: false },
      { id: 'resp-3', name: "Sons de 'f' / 's' / 'x' em staccato", videos: [], completed: false },
      { id: 'resp-4', name: 'Inspirar e expirar contando tempo', videos: [], completed: false },
    ],
    completed: false,
  },
  {
    id: 'aquecimento-corporal',
    title: 'Aquecimento Corporal',
    time: '+/- 15 min',
    color: '#ffe500',
    exercises: [
      { id: 'corp-1', name: 'Alongamento e articulações', videos: [], completed: false },
      { id: 'corp-2', name: 'Massagens na cervical, crânio, face e laringe', videos: [], completed: false },
      { id: 'corp-3', name: 'Exercício aviãozinho', videos: [], completed: false },
    ],
    completed: false,
  },
  {
    id: 'aquecimento-vocal',
    title: 'Aquecimento Vocal',
    time: '~ 2 min',
    color: '#ffe500',
    exercises: [
      { id: 'vocal-1', name: 'Vibração de língua e lábios', videos: [], completed: false },
      { id: 'vocal-2', name: 'Estalos de língua', videos: [], completed: false },
      { id: 'vocal-3', name: 'Giro de língua', videos: [], completed: false },
    ],
    completed: false,
  },
  {
    id: 'vocalizes',
    title: 'Vocalizes',
    time: '+/- 20 min',
    color: '#ffe500',
    exercises: [
      { id: 'voc-1', name: "Aquecimento laríngeo: 'r' vibrado ou 'r-u-m'", videos: [], completed: false },
      { id: 'voc-2', name: "Ressonância: 'm', 'moioio...', 'meimaimei'", videos: [], completed: false },
      { id: 'voc-3', name: "Abertura e voz na máscara: 'lu...', 'vioviovi'", videos: [], completed: false },
      { id: 'voc-4', name: "Apoio muscular: 'ooooirrirrirriooooi', 'irrirrirrirri'", videos: [], completed: false },
    ],
    completed: false,
  },
  {
    id: 'pratica',
    title: 'Aplicação na Música',
    time: 'Restante do tempo',
    color: '#ffe500',
    exercises: [
      { id: 'prat-1', name: 'Aplicar técnica à música trabalhada', videos: [], completed: false },
      { id: 'prat-2', name: 'Interpretação e dinâmicas', videos: [], completed: false },
    ],
    completed: false,
  },
]

export const useRoutineStore = defineStore('routine', () => {
  function loadFromStorage(): RoadmapNode[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as RoadmapNode[]
        for (const node of parsed) {
          for (const ex of node.exercises) {
            // Migrar videos antigos para media
            if (!ex.media) {
              ex.media = []
              if (ex.videos && ex.videos.length > 0) {
                ex.media.push(...ex.videos.map(v => ({ id: `mig-${Date.now()}-${Math.random()}`, type: 'video' as const, url: v.url, duration: v.duration })))
              } else if (ex.videoUrl) {
                ex.media.push({ id: `mig-${Date.now()}-${Math.random()}`, type: 'video', url: ex.videoUrl, duration: ex.videoDuration })
              }
            }
          }
        }
        return parsed
      }
    } catch (e) {
      console.error('Failed to parse routine from storage', e)
    }
    return structuredClone(DEFAULT_NODES)
  }

  const nodes = ref<RoadmapNode[]>(loadFromStorage())

  async function syncFromCloud() {
    if (!auth.currentUser) return
    const docRef = doc(db, 'users', auth.currentUser.uid)
    try {
      const snapshot = await getDoc(docRef)
      if (snapshot.exists() && snapshot.data().routine) {
        const data = snapshot.data()
        nodes.value = data.routine
        
        const today = getLocalDayISO()
        if (data.lastActiveDate !== today) {
          // Os dados da nuvem são de um dia anterior, resetamos
          resetDaily()
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes.value))
        }
      } else {
        await saveToCloud()
      }
    } catch (err) {
      console.error('Failed to sync routine from cloud', err)
    }
  }

  async function saveToCloud() {
    if (!auth.currentUser) return
    const docRef = doc(db, 'users', auth.currentUser.uid)
    try {
      const today = getLocalDayISO()
      await setDoc(docRef, { routine: nodes.value, lastActiveDate: today }, { merge: true })
    } catch (err) {
      console.error('Failed to save routine to cloud', err)
    }
  }

  function saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes.value))
    saveToCloud()
  }

  const totalDuration = computed<number>(() => {
    let sum = 0
    for (const node of nodes.value) {
      for (const exercise of node.exercises) {
        if (exercise.media && exercise.media.length > 0) {
          sum += exercise.media.reduce((acc, m) => acc + (m.duration || 0), 0)
        } else if (exercise.videos && exercise.videos.length > 0) {
          sum += exercise.videos.reduce((acc, v) => acc + (v.duration || 0), 0)
        } else if (exercise.videoDuration) {
          sum += exercise.videoDuration
        }
      }
    }
    return sum
  })

  const isAllCompleted = computed<boolean>(() => {
    return nodes.value.length > 0 && nodes.value.every(n => n.completed)
  })

  const showCompletionCelebration = ref(false)

  function triggerCelebration(): void {
    showCompletionCelebration.value = true
  }

  function dismissCelebration(): void {
    showCompletionCelebration.value = false
  }

  let previousAllCompleted = isAllCompleted.value
  watch(isAllCompleted, (completed) => {
    if (completed && !previousAllCompleted) {
      showCompletionCelebration.value = true
    }
    previousAllCompleted = completed
  })

  function toggleExercise(nodeId: string, exerciseId: string, forceState?: boolean): void {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return
    const exercise = node.exercises.find(e => e.id === exerciseId)
    if (!exercise) return
    if (forceState !== undefined) {
      exercise.completed = forceState
    } else {
      exercise.completed = !exercise.completed
    }
    node.completed = node.exercises.every(e => e.completed)
    saveToStorage()
  }

  function addExercise(nodeId: string, name: string, media?: import('@/types').MediaItem[], notes?: string): void {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return
    const id = `${nodeId}-${Date.now()}`
    node.exercises.push({ id, name, media: media || [], notes: notes || '', completed: false })
    node.completed = false
    saveToStorage()
  }

  function removeExercise(nodeId: string, exerciseId: string): void {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return
    node.exercises = node.exercises.filter(e => e.id !== exerciseId)
    node.completed = node.exercises.length > 0 && node.exercises.every(e => e.completed)
    saveToStorage()
  }

  function updateExercise(nodeId: string, exerciseId: string, updates: Partial<RoadmapNode['exercises'][0]>): void {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return
    const exercise = node.exercises.find(e => e.id === exerciseId)
    if (!exercise) return
    Object.assign(exercise, updates)
    saveToStorage()
  }


  function resetSectionToDefault(nodeId: string): void {
    const node = nodes.value.find(n => n.id === nodeId)
    const defaultNode = DEFAULT_NODES.find(n => n.id === nodeId)
    if (!node || !defaultNode) return
    node.title = defaultNode.title
    node.exercises = JSON.parse(JSON.stringify(defaultNode.exercises))
    node.completed = false
    saveToStorage()
  }

  function resetDaily(): void {
    for (const node of nodes.value) {
      node.completed = false
      for (const exercise of node.exercises) {
        exercise.completed = false
      }
    }
    showCompletionCelebration.value = false
    saveToStorage()
  }

  function reorderExercises(nodeId: string, fromIndex: number, toIndex: number): void {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return
    if (fromIndex < 0 || fromIndex >= node.exercises.length) return
    if (toIndex < 0 || toIndex >= node.exercises.length) return
    if (fromIndex === toIndex) return

    const [moved] = node.exercises.splice(fromIndex, 1)
    if (moved) {
      node.exercises.splice(toIndex, 0, moved)
      saveToStorage()
    }
  }

  function moveExerciseUp(nodeId: string, index: number): void {
    reorderExercises(nodeId, index, index - 1)
  }

  function moveExerciseDown(nodeId: string, index: number): void {
    reorderExercises(nodeId, index, index + 1)
  }

  return {
    nodes,
    totalDuration,
    isAllCompleted,
    showCompletionCelebration,
    triggerCelebration,
    dismissCelebration,
    toggleExercise,
    addExercise,
    updateExercise,
    removeExercise,
    reorderExercises,
    moveExerciseUp,
    moveExerciseDown,
    resetSectionToDefault,
    resetDaily,
    saveToStorage,
    syncFromCloud,
  }
})
