import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RoadmapNode, VideoMedia } from '@/types'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'

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
            if (!ex.videos) {
              ex.videos = []
              if (ex.videoUrl) {
                ex.videos.push({ url: ex.videoUrl, duration: ex.videoDuration })
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
    const docRef = doc(db, 'users', auth.currentUser.uid, 'routine', 'main')
    try {
      const snapshot = await getDoc(docRef)
      if (snapshot.exists()) {
        nodes.value = snapshot.data().nodes
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes.value))
      } else {
        await saveToCloud()
      }
    } catch (err) {
      console.error('Failed to sync routine from cloud', err)
    }
  }

  async function saveToCloud() {
    if (!auth.currentUser) return
    const docRef = doc(db, 'users', auth.currentUser.uid, 'routine', 'main')
    try {
      await setDoc(docRef, { nodes: nodes.value })
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
        if (exercise.videos && exercise.videos.length > 0) {
          sum += exercise.videos.reduce((acc, v) => acc + (v.duration || 0), 0)
        } else if (exercise.videoDuration) {
          sum += exercise.videoDuration
        }
      }
    }
    return sum
  })

  const isAllCompleted = computed<boolean>(() => {
    return nodes.value.every(n => n.completed)
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

  function addExercise(nodeId: string, name: string, videos?: VideoMedia[]): void {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return
    const id = `${nodeId}-${Date.now()}`
    node.exercises.push({ id, name, videos: videos || [], completed: false })
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
    saveToStorage()
  }

  return {
    nodes,
    totalDuration,
    isAllCompleted,
    toggleExercise,
    addExercise,
    updateExercise,
    removeExercise,
    resetSectionToDefault,
    resetDaily,
    saveToStorage,
    syncFromCloud,
  }
})
