import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { MetronomeSoundType } from '@/types'

export const useMetronomeStore = defineStore('metronome', () => {
  // ============ PERSISTENCE KEYS ============
  const STORAGE_KEY_BPM = 'trilha-canto-metronome-bpm'
  const STORAGE_KEY_BEATS = 'trilha-canto-metronome-beats'
  const STORAGE_KEY_SOUND = 'trilha-canto-metronome-sound'
  const STORAGE_KEY_VOLUME = 'trilha-canto-metronome-volume'

  // ============ INITIAL STATE ============
  const initialBpm = Math.min(260, Math.max(30, parseInt(localStorage.getItem(STORAGE_KEY_BPM) || '100', 10)))
  const initialBeats = Math.min(12, Math.max(1, parseInt(localStorage.getItem(STORAGE_KEY_BEATS) || '4', 10)))
  const initialSound = (localStorage.getItem(STORAGE_KEY_SOUND) as MetronomeSoundType) || 'woodblock'
  const initialVolume = Math.min(100, Math.max(0, parseInt(localStorage.getItem(STORAGE_KEY_VOLUME) || '80', 10)))

  // ============ STATE ============
  const isPlaying = ref(false)
  const bpm = ref<number>(isNaN(initialBpm) ? 100 : initialBpm)
  const beatsPerMeasure = ref<number>(isNaN(initialBeats) ? 4 : initialBeats)
  const soundType = ref<MetronomeSoundType>(
    ['woodblock', 'beep', 'cowbell', 'stick', 'pop'].includes(initialSound) ? initialSound : 'woodblock'
  )
  const volume = ref<number>(isNaN(initialVolume) ? 80 : initialVolume)

  const currentBeat = ref(1) // 1 to beatsPerMeasure
  const beatTick = ref(0) // increments on every beat to trigger animations

  // ============ GETTERS ============
  const isAccent = computed(() => beatsPerMeasure.value > 1 && currentBeat.value === 1)

  const tempoMarking = computed(() => {
    const val = bpm.value
    if (val < 60) return 'Largo'
    if (val <= 66) return 'Larghetto'
    if (val <= 76) return 'Adagio'
    if (val <= 108) return 'Andante'
    if (val <= 120) return 'Moderato'
    if (val <= 156) return 'Allegro'
    if (val <= 176) return 'Vivace'
    return 'Presto'
  })

  // ============ AUDIO ENGINE ============
  let audioContext: AudioContext | null = null
  let schedulerTimer: number | null = null
  let nextNoteTime = 0.0
  let currentBeatIndex = 0
  const LOOKAHEAD_MS = 25
  const SCHEDULE_AHEAD_TIME = 0.1
  const activeUiTimeouts: number[] = []

  function getAudioContext(): AudioContext {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioContext = new AudioCtx()
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
    return audioContext
  }

  // --- Sound Synthesizers ---
  function playWoodblockSound(ctx: AudioContext, time: number, isAcc: boolean, masterVol: number) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = 'triangle'
    const baseFreq = isAcc ? 1300 : 900
    osc.frequency.setValueAtTime(baseFreq, time)
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, time + 0.04)

    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(baseFreq, time)
    filter.Q.setValueAtTime(4, time)

    const level = (isAcc ? 1.0 : 0.7) * masterVol
    gain.gain.setValueAtTime(level, time)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start(time)
    osc.stop(time + 0.05)
  }

  function playBeepSound(ctx: AudioContext, time: number, isAcc: boolean, masterVol: number) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    const freq = isAcc ? 1320 : 880 // A6 / A5
    osc.frequency.setValueAtTime(freq, time)

    const level = (isAcc ? 0.9 : 0.6) * masterVol
    gain.gain.setValueAtTime(level, time)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.07)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(time)
    osc.stop(time + 0.08)
  }

  function playCowbellSound(ctx: AudioContext, time: number, isAcc: boolean, masterVol: number) {
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()

    filter.type = 'bandpass'
    const filterFreq = isAcc ? 1100 : 850
    filter.frequency.setValueAtTime(filterFreq, time)
    filter.Q.setValueAtTime(3.5, time)

    osc1.type = 'square'
    osc2.type = 'square'
    const f1 = isAcc ? 840 : 587
    const f2 = isAcc ? 560 : 400
    osc1.frequency.setValueAtTime(f1, time)
    osc2.frequency.setValueAtTime(f2, time)

    const level = (isAcc ? 0.8 : 0.55) * masterVol
    gain.gain.setValueAtTime(level, time)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1)

    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(time)
    osc2.start(time)
    osc1.stop(time + 0.11)
    osc2.stop(time + 0.11)
  }

  function playStickSound(ctx: AudioContext, time: number, isAcc: boolean, masterVol: number) {
    const bufferSize = Math.floor(ctx.sampleRate * 0.03)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.9
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(isAcc ? 2600 : 1800, time)

    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(isAcc ? 1500 : 1000, time)

    const gain = ctx.createGain()
    const level = (isAcc ? 1.0 : 0.65) * masterVol
    gain.gain.setValueAtTime(level, time)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03)

    noise.connect(filter)
    filter.connect(gain)
    osc.connect(gain)
    gain.connect(ctx.destination)

    noise.start(time)
    osc.start(time)
    noise.stop(time + 0.035)
    osc.stop(time + 0.035)
  }

  function playPopSound(ctx: AudioContext, time: number, isAcc: boolean, masterVol: number) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    const startFreq = isAcc ? 950 : 680
    const endFreq = isAcc ? 250 : 180
    osc.frequency.setValueAtTime(startFreq, time)
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.055)

    const level = (isAcc ? 0.9 : 0.6) * masterVol
    gain.gain.setValueAtTime(level, time)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(time)
    osc.stop(time + 0.065)
  }

  function playSoundAtTime(type: MetronomeSoundType, time: number, isAcc: boolean) {
    const ctx = getAudioContext()
    const masterVol = (volume.value / 100) * 0.8
    if (masterVol <= 0) return

    switch (type) {
      case 'woodblock':
        playWoodblockSound(ctx, time, isAcc, masterVol)
        break
      case 'beep':
        playBeepSound(ctx, time, isAcc, masterVol)
        break
      case 'cowbell':
        playCowbellSound(ctx, time, isAcc, masterVol)
        break
      case 'stick':
        playStickSound(ctx, time, isAcc, masterVol)
        break
      case 'pop':
        playPopSound(ctx, time, isAcc, masterVol)
        break
    }
  }

  function scheduleNote(beatNumber: number, time: number) {
    const isAcc = beatsPerMeasure.value > 1 && beatNumber === 0
    playSoundAtTime(soundType.value, time, isAcc)

    const ctx = getAudioContext()
    const delayMs = Math.max(0, (time - ctx.currentTime) * 1000)
    const timeoutId = window.setTimeout(() => {
      if (!isPlaying.value) return
      currentBeat.value = beatNumber + 1
      beatTick.value++
    }, delayMs)

    activeUiTimeouts.push(timeoutId)
    if (activeUiTimeouts.length > 50) {
      activeUiTimeouts.splice(0, activeUiTimeouts.length - 20)
    }
  }

  function advanceNote() {
    const secondsPerBeat = 60.0 / bpm.value
    nextNoteTime += secondsPerBeat
    currentBeatIndex = (currentBeatIndex + 1) % beatsPerMeasure.value
  }

  function scheduler() {
    const ctx = getAudioContext()
    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_TIME) {
      scheduleNote(currentBeatIndex, nextNoteTime)
      advanceNote()
    }
  }

  // ============ ACTIONS ============
  function start() {
    if (isPlaying.value) return
    const ctx = getAudioContext()
    currentBeatIndex = 0
    currentBeat.value = 1
    nextNoteTime = ctx.currentTime + 0.05
    isPlaying.value = true

    if (schedulerTimer) clearInterval(schedulerTimer)
    schedulerTimer = window.setInterval(scheduler, LOOKAHEAD_MS)
  }

  function stop() {
    isPlaying.value = false
    if (schedulerTimer) {
      clearInterval(schedulerTimer)
      schedulerTimer = null
    }
    while (activeUiTimeouts.length > 0) {
      const id = activeUiTimeouts.pop()
      if (id) clearTimeout(id)
    }
  }

  function toggle() {
    if (isPlaying.value) {
      stop()
    } else {
      start()
    }
  }

  function setBpm(val: number) {
    const clamped = Math.min(260, Math.max(30, Math.round(val)))
    bpm.value = clamped
  }

  function incrementBpm(delta: number) {
    setBpm(bpm.value + delta)
  }

  function setBeatsPerMeasure(val: number) {
    const clamped = Math.min(12, Math.max(1, Math.round(val)))
    beatsPerMeasure.value = clamped
    if (currentBeat.value > clamped) {
      currentBeat.value = 1
    }
    currentBeatIndex = 0
  }

  function setSoundType(type: MetronomeSoundType) {
    soundType.value = type
    previewSound(type)
  }

  function setVolume(val: number) {
    volume.value = Math.min(100, Math.max(0, Math.round(val)))
  }

  function previewSound(type?: MetronomeSoundType) {
    const ctx = getAudioContext()
    playSoundAtTime(type || soundType.value, ctx.currentTime, true)
  }

  // --- Tap Tempo ---
  const tapHistory: number[] = []
  function tapTempo() {
    const now = performance.now()
    if (tapHistory.length > 0 && now - tapHistory[tapHistory.length - 1]! > 2500) {
      tapHistory.length = 0
    }
    tapHistory.push(now)
    if (tapHistory.length > 5) {
      tapHistory.shift()
    }
    if (tapHistory.length >= 2) {
      let sum = 0
      for (let i = 1; i < tapHistory.length; i++) {
        sum += tapHistory[i]! - tapHistory[i - 1]!
      }
      const avgMs = sum / (tapHistory.length - 1)
      const calculatedBpm = Math.round(60000 / avgMs)
      setBpm(calculatedBpm)
    }
    previewSound()
  }

  // ============ PERSISTENCE WATCHERS ============
  watch(bpm, (v) => localStorage.setItem(STORAGE_KEY_BPM, v.toString()))
  watch(beatsPerMeasure, (v) => localStorage.setItem(STORAGE_KEY_BEATS, v.toString()))
  watch(soundType, (v) => localStorage.setItem(STORAGE_KEY_SOUND, v))
  watch(volume, (v) => localStorage.setItem(STORAGE_KEY_VOLUME, v.toString()))

  return {
    // State
    isPlaying,
    bpm,
    beatsPerMeasure,
    soundType,
    volume,
    currentBeat,
    beatTick,
    // Getters
    isAccent,
    tempoMarking,
    // Actions
    start,
    stop,
    toggle,
    setBpm,
    incrementBpm,
    setBeatsPerMeasure,
    setSoundType,
    setVolume,
    previewSound,
    tapTempo
  }
})
