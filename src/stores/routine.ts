import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RoadmapNode } from '@/types'

const STORAGE_KEY = 'trilha-canto-routine'

const DEFAULT_NODES: RoadmapNode[] = [
  {
    id: 'respiracao',
    title: 'Respiração e Suporte',
    time: 'Tempo flexível',
    color: '#ffe500',
    exercises: [
      { id: 'resp-1', name: 'Inspiração e expiração livres', completed: false },
      { id: 'resp-2', name: "Sons de 's' em staccato", completed: false },
      { id: 'resp-3', name: "Sons de 'f' / 's' / 'x' em staccato", completed: false },
      { id: 'resp-4', name: 'Inspirar e expirar contando tempo', completed: false },
    ],
    completed: false,
  },
  {
    id: 'aquecimento-corporal',
    title: 'Aquecimento Corporal',
    time: '+/- 15 min',
    color: '#ffe500',
    exercises: [
      { id: 'corp-1', name: 'Alongamento e articulações', completed: false },
      { id: 'corp-2', name: 'Massagens na cervical, crânio, face e laringe', completed: false },
      { id: 'corp-3', name: 'Exercício aviãozinho', completed: false },
    ],
    completed: false,
  },
  {
    id: 'aquecimento-vocal',
    title: 'Aquecimento Vocal',
    time: '~ 2 min',
    color: '#ffe500',
    exercises: [
      { id: 'vocal-1', name: 'Vibração de língua e lábios', completed: false },
      { id: 'vocal-2', name: 'Estalos de língua', completed: false },
      { id: 'vocal-3', name: 'Giro de língua', completed: false },
    ],
    completed: false,
  },
  {
    id: 'vocalizes',
    title: 'Vocalizes',
    time: '+/- 20 min',
    color: '#ffe500',
    exercises: [
      { id: 'voc-1', name: "Aquecimento laríngeo: 'r' vibrado ou 'r-u-m'", completed: false },
      { id: 'voc-2', name: "Ressonância: 'm', 'moioio...', 'meimaimei'", completed: false },
      { id: 'voc-3', name: "Abertura e voz na máscara: 'lu...', 'vioviovi'", completed: false },
      { id: 'voc-4', name: "Apoio muscular: 'ooooirrirrirriooooi', 'irrirrirrirri'", completed: false },
    ],
    completed: false,
  },
  {
    id: 'pratica',
    title: 'Aplicação na Música',
    time: 'Restante do tempo',
    color: '#ffe500',
    exercises: [
      { id: 'prat-1', name: 'Aplicar técnica à música trabalhada', completed: false },
      { id: 'prat-2', name: 'Interpretação e dinâmicas', completed: false },
    ],
    completed: false,
  },
]

export const useRoutineStore = defineStore('routine', () => {
  // ============ PERSISTÊNCIA ============
  function loadFromStorage(): RoadmapNode[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to parse routine from storage', e)
    }
    return structuredClone(DEFAULT_NODES)
  }

  function saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes.value))
  }

  // ============ STATE ============
  const nodes = ref<RoadmapNode[]>(loadFromStorage())

  // ============ GETTERS ============
  const totalDuration = computed<number>(() => {
    let sum = 0
    for (const node of nodes.value) {
      for (const exercise of node.exercises) {
        if (exercise.videoDuration !== undefined) {
          sum += exercise.videoDuration
        }
      }
    }
    return sum
  })

  const isAllCompleted = computed<boolean>(() => {
    return nodes.value.every(n => n.completed)
  })

  // ============ ACTIONS ============
  function toggleExercise(nodeId: string, exerciseId: string): void {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return
    const exercise = node.exercises.find(e => e.id === exerciseId)
    if (!exercise) return
    exercise.completed = !exercise.completed
    node.completed = node.exercises.every(e => e.completed)
    saveToStorage()
  }

  function addExercise(nodeId: string, name: string, videoUrl?: string, videoDuration?: number): void {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return
    const id = `${nodeId}-${Date.now()}`
    node.exercises.push({ id, name, videoUrl, videoDuration, completed: false })
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
    removeExercise,
    resetDaily,
  }
})
