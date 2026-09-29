export interface VideoMedia {
  url: string;
  duration?: number;
}

export interface MediaItem {
  id: string
  type: 'video' | 'reference'
  url: string
  title?: string
  duration?: number
}

export interface Exercise {
  id: string              // Gerado com `${nodeId}-${Date.now()}`
  name: string            // Nome do exercício (ex: "Vibração de língua")
  notes?: string          // Notas ricas do exercício (HTML)
  media?: MediaItem[]     // Arquivos de mídia (vídeos ou referências)
  videos?: VideoMedia[]   // DEPRECATED - migrado para media
  videoUrl?: string       // DEPRECATED - manter por fallback temporário ou migrar
  videoDuration?: number  // DEPRECATED
  completed: boolean      // Se concluído na sessão atual
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
