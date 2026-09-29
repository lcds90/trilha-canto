# Contexto 06 — Store: Routine (Rotina)

> Crie o arquivo `src/stores/routine.ts` usando Pinia Composition API.

## Arquivo: `src/stores/routine.ts`

## Pré-requisitos
- `src/types/index.ts` criado (contexto 03)
- Pinia instalado (^4.0) e configurado no main.ts

## Interfaces Necessárias (de `@/types`)

```typescript
interface Exercise {
  id: string
  name: string
  videoUrl?: string
  videoDuration?: number  // segundos
  completed: boolean
}

interface RoadmapNode {
  id: string
  title: string
  time: string
  color: string
  exercises: Exercise[]
  completed: boolean
}
```

## Dados Iniciais (DEFAULT_NODES)

Usado como fallback quando não há dados no localStorage:

```typescript
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
```

## Especificação da Store

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RoadmapNode } from '@/types'

const STORAGE_KEY = 'trilha-canto-routine'

export const useRoutineStore = defineStore('routine', () => {
  // ============ PERSISTÊNCIA ============

  function loadFromStorage(): RoadmapNode[] {
    // 1. Tenta localStorage.getItem(STORAGE_KEY)
    // 2. Se existir, JSON.parse e retorna
    // 3. Se não existir ou falhar, retorna structuredClone(DEFAULT_NODES)
  }

  function saveToStorage(): void {
    // localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes.value))
  }

  // ============ STATE ============

  const nodes = ref<RoadmapNode[]>(loadFromStorage())

  // ============ GETTERS ============

  const totalDuration = computed<number>(() => {
    // Soma de exercise.videoDuration de TODOS os exercícios de TODOS os nós
    // Retorna total em segundos
    // Se videoDuration for undefined, conta como 0
  })

  const isAllCompleted = computed<boolean>(() => {
    // nodes.value.every(n => n.completed)
  })

  // ============ ACTIONS ============

  function toggleExercise(nodeId: string, exerciseId: string): void {
    // 1. const node = nodes.value.find(n => n.id === nodeId)
    // 2. if (!node) return
    // 3. const exercise = node.exercises.find(e => e.id === exerciseId)
    // 4. if (!exercise) return
    // 5. exercise.completed = !exercise.completed
    // 6. node.completed = node.exercises.every(e => e.completed)
    // 7. saveToStorage()
  }

  function addExercise(nodeId: string, name: string, videoUrl?: string, videoDuration?: number): void {
    // 1. const node = nodes.value.find(n => n.id === nodeId)
    // 2. if (!node) return
    // 3. const id = `${nodeId}-${Date.now()}`
    // 4. node.exercises.push({ id, name, videoUrl, videoDuration, completed: false })
    // 5. node.completed = false  // novo exercício não concluído
    // 6. saveToStorage()
  }

  function removeExercise(nodeId: string, exerciseId: string): void {
    // 1. const node = nodes.value.find(n => n.id === nodeId)
    // 2. if (!node) return
    // 3. node.exercises = node.exercises.filter(e => e.id !== exerciseId)
    // 4. node.completed = node.exercises.length > 0 && node.exercises.every(e => e.completed)
    // 5. saveToStorage()
  }

  function resetDaily(): void {
    // 1. Para cada nó: node.completed = false
    // 2. Para cada exercício de cada nó: exercise.completed = false
    // 3. saveToStorage()
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
```

## Como é usada

```typescript
import { useRoutineStore } from '@/stores/routine'

const routineStore = useRoutineStore()

// Acessar nós
routineStore.nodes            // RoadmapNode[]
routineStore.nodes[0].title   // 'Respiração e Suporte'

// Marcar exercício
routineStore.toggleExercise('respiracao', 'resp-1')

// Adicionar exercício com vídeo
routineStore.addExercise('vocalizes', 'Novo exercício', 'https://youtube.com/...', 180)

// Remover exercício
routineStore.removeExercise('vocalizes', 'vocalizes-1234567890')

// Resetar sessão do dia
routineStore.resetDaily()

// Duração total
routineStore.totalDuration    // número em segundos
routineStore.isAllCompleted   // boolean
```

## Persistência na Nuvem (Firestore)
Foram adicionadas funções para sincronizar o progresso no Firestore quando o usuário estiver logado:
- `syncFromCloud()`: Busca a rotina salva em `users/{uid}/routine/main`.
- `saveToCloud()`: Salva o estado atual na nuvem, acionado automaticamente a cada chamada de `saveToStorage()`.
