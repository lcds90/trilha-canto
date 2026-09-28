import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai'
import firebaseApp from './firebase'
import type { AIAnalysis, RoadmapNode } from '@/types'

// Inicializa o serviço de IA do Firebase
export const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() })

// Modelo Gemini (melhor para multimodalidade: vídeo/áudio)
export const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash' })

/**
 * Analisa uma seção da rotina de canto usando IA generativa.
 *
 * IMPORTANTE: A verificação de rate limiting NÃO é feita aqui.
 * O componente/caller deve verificar `aiUsageStore.canCall` e chamar
 * `aiUsageStore.recordCall()` ANTES de chamar esta função.
 *
 * Isso evita dependência circular entre ai.ts e stores/aiUsage.ts.
 */
export async function analyzeSection(node: RoadmapNode): Promise<AIAnalysis> {
  const exercisesList = node.exercises
    .map(
      (e, i) =>
        `${i + 1}. ${e.name} ${e.completed ? '(concluído ✓)' : '(pendente)'} ${e.videoUrl ? `[vídeo: ${e.videoUrl}]` : ''}`,
    )
    .join('\n')

  const prompt = `
Você é um professor de canto experiente e encorajador. Analise a seguinte seção de prática de canto e dê feedback personalizado:

Seção: ${node.title}
Tempo sugerido: ${node.time}
Exercícios:
${exercisesList}

Por favor, forneça:
1. Uma análise breve da seção (2-3 frases)
2. 2-3 sugestões práticas de melhoria

Responda em português brasileiro, de forma encorajadora e prática. Formate as sugestões como itens de lista.
`

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  // Separa feedback das sugestões por regex
  const parts = text.split(/sugest[õo]es?[:\s]*/i)
  const feedback = (parts[0] ?? text).trim()
  const suggestionsRaw = parts[1] ?? ''
  const suggestions = suggestionsRaw
    .split(/\n[-•*\d.]+\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  return {
    feedback,
    suggestions: suggestions.length > 0 ? suggestions : ['Continue praticando regularmente!'],
    timestamp: Date.now(),
  }
}
