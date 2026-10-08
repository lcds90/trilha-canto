import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const DAILY_LIMIT = 1500
const PER_MINUTE_LIMIT = 10
const WARNING_PERCENT = 80
const CRITICAL_PERCENT = 95
const STORAGE_KEY = 'trilha-canto-ai-usage'
import { getLocalDayISO as getTodayISO } from '@/lib/date'

export const useAIUsageStore = defineStore('aiUsage', () => {
  const date = ref(getTodayISO())
  const requestCount = ref(0)
  const minuteTimestamps = ref<number[]>([])

  function load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.date === getTodayISO()) {
          date.value = parsed.date
          requestCount.value = parsed.requestCount
        } else {
          date.value = getTodayISO()
          requestCount.value = 0
          save()
        }
      }
    } catch (e) {
      console.error('Failed to parse AI usage from storage', e)
    }
  }

  function save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: date.value,
      requestCount: requestCount.value,
    }))
  }

  const usagePercent = computed<number>(() => {
    return Math.min(100, Math.max(0, Math.round((requestCount.value / DAILY_LIMIT) * 100)))
  })

  const canCall = computed<boolean>(() => {
    checkDayReset()
    if (requestCount.value >= DAILY_LIMIT) return false
    const now = Date.now()
    const recent = minuteTimestamps.value.filter(t => now - t < 60000)
    if (recent.length >= PER_MINUTE_LIMIT) return false
    return true
  })

  const isWarning = computed<boolean>(() => {
    return usagePercent.value >= WARNING_PERCENT
  })

  const isCritical = computed<boolean>(() => {
    return usagePercent.value >= CRITICAL_PERCENT
  })

  const isBlocked = computed<boolean>(() => {
    return requestCount.value >= DAILY_LIMIT
  })

  const remainingToday = computed<number>(() => {
    return Math.max(0, DAILY_LIMIT - requestCount.value)
  })

  function checkDayReset(): void {
    if (date.value !== getTodayISO()) {
      date.value = getTodayISO()
      requestCount.value = 0
      minuteTimestamps.value = []
      save()
    }
  }

  function recordCall(): void {
    checkDayReset()
    requestCount.value++
    minuteTimestamps.value.push(Date.now())
    minuteTimestamps.value = minuteTimestamps.value.filter(t => Date.now() - t < 60000)
    save()
  }

  load()

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
    DAILY_LIMIT,
  }
})
