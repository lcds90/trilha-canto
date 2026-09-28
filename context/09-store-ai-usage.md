# Contexto 09 — Store: AI Usage (Controle de Limites)

> Crie o arquivo `src/stores/aiUsage.ts` usando Pinia Composition API.

## Arquivo: `src/stores/aiUsage.ts`

## Propósito
Controla o uso diário da Firebase AI Logic para respeitar os limites do plano Spark:
- **1500 requisições/dia** (Gemini 2.5 Flash)
- **10 requisições/minuto**

Exibe avisos progressivos: 80% → 95% → 100% (bloqueio).

## Especificação Completa

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ============ CONSTANTES ============

const DAILY_LIMIT = 1500         // Limite diário Gemini 2.5 Flash (Spark)
const PER_MINUTE_LIMIT = 10     // Max requisições por minuto
const WARNING_PERCENT = 80      // Aviso em 80%
const CRITICAL_PERCENT = 95     // Aviso crítico em 95%
const STORAGE_KEY = 'trilha-canto-ai-usage'

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]!
}

export const useAIUsageStore = defineStore('aiUsage', () => {

  // ============ STATE ============

  const date = ref(getTodayISO())          // Data do contador
  const requestCount = ref(0)              // Chamadas feitas hoje
  const minuteTimestamps = ref<number[]>([]) // Timestamps do último minuto (in-memory)

  // ============ PERSISTÊNCIA ============

  function load(): void {
    // 1. const saved = localStorage.getItem(STORAGE_KEY)
    // 2. Se existir → JSON.parse
    //    a. Se saved.date === getTodayISO() → usa saved.date e saved.requestCount
    //    b. Se saved.date !== hoje → reset (dia novo)
    // 3. Se não existir → mantém valores default (0)
    // OBS: minuteTimestamps NÃO é persistido (só in-memory)
  }

  function save(): void {
    // localStorage.setItem(STORAGE_KEY, JSON.stringify({
    //   date: date.value,
    //   requestCount: requestCount.value,
    // }))
    // Nota: minuteTimestamps não é salvo
  }

  // ============ GETTERS ============

  const usagePercent = computed<number>(() => {
    // Math.round((requestCount.value / DAILY_LIMIT) * 100)
    // Clamped entre 0 e 100
  })

  const canCall = computed<boolean>(() => {
    // 1. Chama checkDayReset() para garantir que a data está atualizada
    // 2. Se requestCount >= DAILY_LIMIT → false
    // 3. Filtra minuteTimestamps: mantém apenas timestamps dos últimos 60 segundos
    // 4. Se count de timestamps recentes >= PER_MINUTE_LIMIT → false
    // 5. Senão → true
  })

  const isWarning = computed<boolean>(() => {
    // usagePercent >= WARNING_PERCENT (80%)
    // Usado para exibir Toast de aviso amarelo
  })

  const isCritical = computed<boolean>(() => {
    // usagePercent >= CRITICAL_PERCENT (95%)
    // Usado para exibir Toast de aviso vermelho
  })

  const isBlocked = computed<boolean>(() => {
    // requestCount >= DAILY_LIMIT
    // Usado para bloquear o botão de IA e mostrar Dialog
  })

  const remainingToday = computed<number>(() => {
    // Math.max(0, DAILY_LIMIT - requestCount.value)
  })

  // ============ ACTIONS ============

  function checkDayReset(): void {
    // Se date.value !== getTodayISO() → reset:
    //   date = getTodayISO()
    //   requestCount = 0
    //   minuteTimestamps = []
    //   save()
  }

  function recordCall(): void {
    // 1. checkDayReset()
    // 2. requestCount++
    // 3. minuteTimestamps.push(Date.now())
    // 4. Limpa timestamps mais velhos que 60s:
    //    minuteTimestamps = minuteTimestamps.filter(t => Date.now() - t < 60000)
    // 5. save()
  }

  // ============ INIT ============
  load()  // Carrega dados do localStorage na criação da store

  return {
    requestCount,
    usagePercent,
    canCall,
    isWarning,
    isCritical,
    isBlocked,
    remainingToday,
    recordCall,
    checkDayReset,
    DAILY_LIMIT,  // Exporta a constante para uso na UI
  }
})
```

## Como é usada

```typescript
import { useAIUsageStore } from '@/stores/aiUsage'

const aiUsage = useAIUsageStore()

// Antes de chamar a IA:
if (!aiUsage.canCall) {
  if (aiUsage.isBlocked) {
    alert('Limite diário atingido! Tente amanhã.')
  } else {
    alert('Muitas chamadas por minuto. Aguarde.')
  }
  return
}

// Registrar chamada ANTES de fazer a requisição:
aiUsage.recordCall()
const result = await analyzeSection(node)

// Na UI — indicador de uso:
// "42 / 1500 chamadas (3%)"
`${aiUsage.requestCount} / ${aiUsage.DAILY_LIMIT} chamadas (${aiUsage.usagePercent}%)`

// Cores do indicador:
// Normal (< 80%): azul/neutro
// Warning (>= 80%): amarelo → aiUsage.isWarning
// Critical (>= 95%): vermelho → aiUsage.isCritical
// Blocked (100%): vermelho + desabilitado → aiUsage.isBlocked
```

## Feedback Visual — Thresholds

| Uso | Status | Cor | Ação na UI |
|-----|--------|-----|-----------|
| 0-79% | Normal | Azul/neutro | Nenhuma |
| 80-94% | Aviso | Amarelo | Toast: "Você usou 80% do limite diário de IA" |
| 95-99% | Crítico | Vermelho | Toast: "Limite quase atingido! Desabilitando chamadas automáticas" |
| 100% | Bloqueado | Vermelho + disabled | Dialog: "Limite atingido. Tente amanhã." + Botão IA desabilitado |
