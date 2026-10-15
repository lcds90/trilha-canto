import { ref } from 'vue'

const STORAGE_KEY_VOICE = 'trilha-canto-voice-enabled'
const isVoiceEnabled = ref(
  typeof localStorage !== 'undefined'
    ? localStorage.getItem(STORAGE_KEY_VOICE) !== 'false'
    : true
)

let ptVoice: SpeechSynthesisVoice | null = null

function updateVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    const voices = window.speechSynthesis.getVoices()
    ptVoice =
      voices.find(v => v.lang === 'pt-BR' || v.lang === 'pt_BR') ||
      voices.find(v => v.lang.startsWith('pt')) ||
      null
  } catch {
    ptVoice = null
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  updateVoices()
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = updateVoices
  }
}

export function useVoiceCoach() {
  function toggleVoice() {
    isVoiceEnabled.value = !isVoiceEnabled.value
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_VOICE, isVoiceEnabled.value.toString())
    }
  }

  function setVoiceEnabled(val: boolean) {
    isVoiceEnabled.value = val
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_VOICE, val.toString())
    }
  }

  function speak(text: 'Iniciando' | 'Finalizado' | string) {
    if (!isVoiceEnabled.value) return
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'pt-BR'
      utterance.rate = 1.05
      utterance.pitch = 1.0

      if (!ptVoice) updateVoices()
      if (ptVoice) {
        utterance.voice = ptVoice
      }

      window.speechSynthesis.speak(utterance)
    } catch (err) {
      console.warn('[useVoiceCoach] Failed to speak:', err)
    }
  }

  return {
    isVoiceEnabled,
    toggleVoice,
    setVoiceEnabled,
    speak
  }
}
