# Contexto 08 — Store: Streak (Ofensiva)

> Crie o arquivo `src/stores/streak.ts` usando Pinia Composition API.

## Arquivo: `src/stores/streak.ts`

## Pré-requisitos
- `src/types/index.ts` criado (contexto 03)

## Interface Necessária (de `@/types`)

```typescript
interface DayRecord {
  date: string            // 'YYYY-MM-DD'
  completedNodes: string[] // IDs dos nós completados
  totalDuration: number   // segundos
}
```

## Propósito
Rastreia o histórico de prática diária, calcula ofensiva (dias consecutivos) e fornece dados para o calendário visual de 30 dias.

## Especificação Completa

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DayRecord } from '@/types'

const STORAGE_KEY = 'trilha-canto-streak'

// ============ HELPERS ============

import { getLocalDayISO as getTodayISO } from '@/lib/date'

function getDaysDiff(date1: string, date2: string): number {
  // Diferença em dias inteiros entre duas datas ISO
  // const d1 = new Date(date1).getTime()
  // const d2 = new Date(date2).getTime()
  // return Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
}

export const useStreakStore = defineStore('streak', () => {

  // ============ PERSISTÊNCIA ============

  function loadHistory(): DayRecord[] {
    // Tenta localStorage.getItem(STORAGE_KEY)
    // Se existir → JSON.parse e retorna
    // Se não → retorna []
  }

  function saveHistory(): void {
    // localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
  }

  // ============ STATE ============

  const history = ref<DayRecord[]>(loadHistory())

  // ============ GETTERS ============

  const currentStreak = computed<number>(() => {
    // 1. Se history vazio → return 0
    // 2. Copia e ordena por data DESC (mais recente primeiro)
    // 3. Pega o mais recente (sorted[0])
    // 4. Calcula diff do mais recente até hoje
    // 5. Se diff > 1 → return 0 (quebrou a sequência)
    // 6. Itera: para cada par adjacente (sorted[i], sorted[i+1])
    //    Se diff === 1 → streak++
    //    Senão → break
    // 7. Retorna streak
  })

  const longestStreak = computed<number>(() => {
    // 1. Se history vazio → return 0
    // 2. Copia e ordena por data ASC
    // 3. Itera calculando sequências consecutivas (diff === 1)
    // 4. Retorna o máximo encontrado
  })

  const todayRecord = computed<DayRecord | undefined>(() => {
    // Encontra registro com date === getTodayISO()
  })

  const last30Days = computed<Array<{ date: string; practiced: boolean }>>(() => {
    // 1. Cria array de 30 elementos
    // 2. Para cada dia (de 29 atrás até hoje):
    //    - Calcula a data ISO
    //    - Verifica se há DayRecord no history com essa data
    // 3. Retorna [{ date: 'YYYY-MM-DD', practiced: boolean }, ...]
    // 4. Ordem: do mais antigo (índice 0) ao mais recente (índice 29)
  })

  // ============ ACTIONS ============

  function recordPractice(completedNodes: string[], totalDuration: number): void {
    // 1. const today = getTodayISO()
    // 2. const existing = history.find(d => d.date === today)
    // 3. Se já existe → atualiza completedNodes e totalDuration
    // 4. Se não existe → push novo DayRecord
    // 5. Ordena history por data ASC
    // 6. saveHistory()
  }

  return {
    history,
    currentStreak,
    longestStreak,
    todayRecord,
    last30Days,
    recordPractice,
  }
})
```

## Como é usada

```typescript
import { useStreakStore } from '@/stores/streak'

const streakStore = useStreakStore()

// Visualizar dados
streakStore.currentStreak    // 5 (dias consecutivos)
streakStore.longestStreak    // 12 (recorde)
streakStore.todayRecord      // DayRecord | undefined
streakStore.last30Days       // Array de 30 objetos para o calendário

// Registrar prática do dia (chamado ao concluir sessão)
streakStore.recordPractice(
  ['respiracao', 'aquecimento-corporal', 'vocalizes'],  // nós completados
  2400,  // 40 min em segundos
)
```

## Lógica do Streak — Exemplos

| Histórico | Hoje | currentStreak |
|-----------|------|---------------|
| `[]` | 2026-09-28 | `0` |
| `[09-28]` | 09-28 | `1` |
| `[09-27, 09-28]` | 09-28 | `2` |
| `[09-26, 09-27]` | 09-28 | `2` (ontem + anteontem) |
| `[09-25, 09-27]` | 09-28 | `1` (só ontem, gap no 26) |
| `[09-20, 09-21, 09-22]` | 09-28 | `0` (último foi há 6 dias) |

## Persistência na Nuvem (Firestore)
Foram adicionadas funções para sincronizar a ofensiva no Firestore quando o usuário estiver logado:
- `syncFromCloud()`: Busca o histórico em `users/{uid}`.
- `saveToCloud()`: Salva o histórico atual na nuvem, acionado automaticamente a cada chamada de `saveHistory()`.
