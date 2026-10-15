let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!audioContext) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return null
      audioContext = new AudioCtx()
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {})
    }
    return audioContext
  } catch (err) {
    console.warn('[celebrationSound] Failed to initialize AudioContext:', err)
    return null
  }
}

/**
 * Plays a rich, celebratory victory fanfare chime using the Web Audio API.
 * Uses warm harmonic tones (triangle + sine) and sparkling bell chimes.
 */
export function playCelebrationSound() {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime

  // Master gain node
  const masterGain = ctx.createGain()
  masterGain.gain.setValueAtTime(0.55, now)
  masterGain.connect(ctx.destination)

  // Lowpass filter for warm acoustic character
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(4500, now)
  filter.Q.setValueAtTime(1.2, now)
  filter.connect(masterGain)

  function playTone(
    freq: number,
    startTime: number,
    duration: number,
    peakGain: number,
    type: OscillatorType = 'triangle'
  ) {
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, startTime)

    // Smooth envelope avoiding audio clicks
    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    osc.connect(gain)
    gain.connect(filter)

    osc.start(startTime)
    osc.stop(startTime + duration + 0.05)
  }

  // 1. Upward celebratory arpeggio: C5 -> E5 -> G5 -> C6 -> E6
  const arpeggio = [
    { freq: 523.25, time: 0.0, dur: 0.35, gain: 0.32 },
    { freq: 659.25, time: 0.1, dur: 0.35, gain: 0.32 },
    { freq: 783.99, time: 0.2, dur: 0.35, gain: 0.36 },
    { freq: 1046.5, time: 0.3, dur: 0.45, gain: 0.4 },
    { freq: 1318.51, time: 0.4, dur: 0.5, gain: 0.38 },
  ]

  arpeggio.forEach(note => {
    playTone(note.freq, now + note.time, note.dur, note.gain, 'triangle')
    playTone(note.freq, now + note.time, note.dur, note.gain * 0.4, 'sine')
  })

  // 2. Final triumphant chord at +0.52s
  const finalChordTime = now + 0.52
  const finalChord = [
    { freq: 523.25, gain: 0.22 }, // C5
    { freq: 659.25, gain: 0.24 }, // E5
    { freq: 783.99, gain: 0.28 }, // G5
    { freq: 1046.5, gain: 0.32 }, // C6
    { freq: 1318.51, gain: 0.24 }, // E6
    { freq: 1567.98, gain: 0.2 }, // G6
  ]

  finalChord.forEach(note => {
    playTone(note.freq, finalChordTime, 1.4, note.gain, 'triangle')
    playTone(note.freq, finalChordTime, 1.5, note.gain * 0.5, 'sine')
  })

  // 3. Shimmer / Bell sparkles
  const sparkles = [
    { freq: 1760.0, time: 0.65 }, // A6
    { freq: 2093.0, time: 0.75 }, // C7
    { freq: 2637.02, time: 0.85 }, // E7
    { freq: 3135.96, time: 0.95 }, // G7
  ]

  sparkles.forEach(s => {
    playTone(s.freq, now + s.time, 0.35, 0.12, 'sine')
  })
}
