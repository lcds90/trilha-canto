import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DayRecord } from '@/types'

const STORAGE_KEY = 'trilha-canto-streak'

// ============ HELPERS ============
function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]!
}

function getDaysDiff(date1: string, date2: string): number {
  const d1 = new Date(date1).getTime()
  const d2 = new Date(date2).getTime()
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
}

export const useStreakStore = defineStore('streak', () => {

  // ============ PERSISTÊNCIA ============
  function loadHistory(): DayRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to parse streak history', e)
    }
    return []
  }

  function saveHistory(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
  }

  // ============ STATE ============
  const history = ref<DayRecord[]>(loadHistory())

  // ============ GETTERS ============
  const currentStreak = computed<number>(() => {
    if (history.value.length === 0) return 0
    const sorted = [...history.value].sort((a, b) => b.date.localeCompare(a.date))
    const today = getTodayISO()
    const diffToToday = getDaysDiff(sorted[0]!.date, today)
    
    if (diffToToday > 1) return 0
    
    let streak = 1
    for (let i = 0; i < sorted.length - 1; i++) {
      if (getDaysDiff(sorted[i + 1]!.date, sorted[i]!.date) === 1) {
        streak++
      } else {
        break
      }
    }
    return streak
  })

  const longestStreak = computed<number>(() => {
    if (history.value.length === 0) return 0
    const sorted = [...history.value].sort((a, b) => a.date.localeCompare(b.date))
    let max = 1
    let current = 1
    for (let i = 0; i < sorted.length - 1; i++) {
      if (getDaysDiff(sorted[i]!.date, sorted[i + 1]!.date) === 1) {
        current++
        if (current > max) max = current
      } else {
        current = 1
      }
    }
    return max
  })

  const todayRecord = computed<DayRecord | undefined>(() => {
    const today = getTodayISO()
    return history.value.find(d => d.date === today)
  })

  const last30Days = computed<Array<{ date: string; practiced: boolean }>>(() => {
    const days = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const iso = d.toISOString().split('T')[0]!
      const practiced = history.value.some(record => record.date === iso)
      days.push({ date: iso, practiced })
    }
    return days
  })

  // ============ ACTIONS ============
  function recordPractice(completedNodes: string[], totalDuration: number): void {
    const today = getTodayISO()
    const existing = history.value.find(d => d.date === today)
    if (existing) {
      existing.completedNodes = completedNodes
      existing.totalDuration = totalDuration
    } else {
      history.value.push({ date: today, completedNodes, totalDuration })
    }
    history.value.sort((a, b) => a.date.localeCompare(b.date))
    saveHistory()
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
