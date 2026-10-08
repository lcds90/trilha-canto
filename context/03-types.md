# Contexto 03 — Types (Interfaces TypeScript)

> Crie o arquivo `src/types/index.ts` com todas as interfaces do projeto.

## Arquivo: `src/types/index.ts`

## Código Completo

```typescript
export interface MediaItem {
  id: string
  type: 'video' | 'reference'
  url: string
  title?: string
  duration?: number
}

export interface Exercise {
  id: string
  name: string
  notes?: string
  media?: MediaItem[]
  videos?: { url: string; duration?: number }[] // DEPRECATED
  videoUrl?: string // DEPRECATED
  videoDuration?: number // DEPRECATED
  completed: boolean
}

export interface RoadmapNode {
  id: string              // Slug (ex: 'respiracao', 'vocalizes')
  title: string           // Título exibido (ex: 'Respiração e Suporte')
  time: string            // Tempo sugerido (ex: '+/- 15 min')
  color: string           // Cor hex (sempre '#ffe500')
  exercises: Exercise[]   // Lista de exercícios da seção
  completed: boolean      // true quando TODOS exercises.completed === true
}

export interface DayRecord {
  date: string            // Formato 'YYYY-MM-DD'
  completedNodes: string[] // IDs dos nós completados nesse dia
  totalDuration: number   // Duração total praticada em segundos
}

export interface AIAnalysis {
  feedback: string        // Texto da análise da IA
  suggestions: string[]   // Lista de sugestões práticas
  timestamp: number       // Date.now() de quando foi gerada
}
```

## Uso

Essas interfaces são importadas em todos os módulos do projeto:

```typescript
import type { Exercise, RoadmapNode, DayRecord, AIAnalysis } from '@/types'
```

## Notas
- O alias `@/` aponta para `./src/` (configurado no `tsconfig.app.json` e `vite.config.ts`)
- `Exercise.videoDuration` é em SEGUNDOS (não minutos). A conversão para "M:SS" é feita na UI
- `RoadmapNode.completed` é derivado: `exercises.every(e => e.completed)`
- `DayRecord.date` usa formato ISO sem horário com ajuste de fuso local: `getLocalDayISO()`
