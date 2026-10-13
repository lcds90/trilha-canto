<script setup lang="ts">
import { ref } from 'vue'
import { useMetronomeStore } from '@/stores/metronome'
import type { MetronomeSoundType } from '@/types'

const metronomeStore = useMetronomeStore()

const isExpanded = ref(true)
const isTapping = ref(false)
const previousVolume = ref(80)

const soundOptions: { label: string; value: MetronomeSoundType; icon: string }[] = [
  { label: 'Madeira', value: 'woodblock', icon: '🪵' },
  { label: 'Digital', value: 'beep', icon: '🔔' },
  { label: 'Baqueta', value: 'stick', icon: '🥢' },
  { label: 'Cowbell', value: 'cowbell', icon: '🪇' },
  { label: 'Gota Pop', value: 'pop', icon: '🫧' }
]

const meterPresets = [1, 2, 3, 4, 6]

function handleTap() {
  isTapping.value = true
  metronomeStore.tapTempo()
  setTimeout(() => {
    isTapping.value = false
  }, 180)
}

function toggleMute() {
  if (metronomeStore.volume > 0) {
    previousVolume.value = metronomeStore.volume
    metronomeStore.setVolume(0)
  } else {
    metronomeStore.setVolume(previousVolume.value || 80)
  }
}
</script>

<template>
  <div class="metronome-widget" :class="{ 'is-playing': metronomeStore.isPlaying }">
    <!-- Header / Mini-Bar -->
    <div class="metronome-header">
      <div class="header-left" @click="isExpanded = !isExpanded">
        <span class="metronome-icon" :class="{ 'icon-pulse': metronomeStore.isPlaying }">⏱️</span>
        <div class="header-titles">
          <span class="title-text">Metrônomo</span>
          <span class="tempo-tag">{{ metronomeStore.bpm }} BPM • {{ metronomeStore.tempoMarking }}</span>
        </div>
      </div>

      <div class="header-actions">
        <!-- Botão Play/Pause Rápido -->
        <button
          class="mini-play-btn"
          :class="{ 'playing': metronomeStore.isPlaying }"
          @click="metronomeStore.toggle()"
          :title="metronomeStore.isPlaying ? 'Parar metrônomo (M)' : 'Iniciar metrônomo (M)'"
        >
          {{ metronomeStore.isPlaying ? '⏹' : '▶' }}
        </button>

        <button
          class="collapse-btn"
          @click="isExpanded = !isExpanded"
          :title="isExpanded ? 'Recolher' : 'Expandir opções'"
        >
          {{ isExpanded ? '▲' : '▼' }}
        </button>
      </div>
    </div>

    <!-- Visualizador de Batidas (Sempre visível) -->
    <div class="beat-visualizer">
      <div
        v-for="b in metronomeStore.beatsPerMeasure"
        :key="b"
        class="beat-dot"
        :class="{
          'is-current': metronomeStore.isPlaying && metronomeStore.currentBeat === b,
          'is-accent': b === 1 && metronomeStore.beatsPerMeasure > 1
        }"
      >
        <span class="beat-num">{{ b }}</span>
      </div>
    </div>

    <!-- Painel Expansível de Controles -->
    <Transition name="metronome-expand">
      <div v-show="isExpanded" class="metronome-body">
        <!-- Seletor de BPM -->
        <div class="bpm-control-section">
          <div class="bpm-display-row">
            <button class="step-btn" @click="metronomeStore.incrementBpm(-5)" title="-5 BPM">-5</button>
            <button class="step-btn small" @click="metronomeStore.incrementBpm(-1)" title="-1 BPM">-1</button>

            <div class="bpm-center-display">
              <span class="bpm-number">{{ metronomeStore.bpm }}</span>
              <span class="bpm-sublabel">BPM ({{ metronomeStore.tempoMarking }})</span>
            </div>

            <button class="step-btn small" @click="metronomeStore.incrementBpm(1)" title="+1 BPM">+1</button>
            <button class="step-btn" @click="metronomeStore.incrementBpm(5)" title="+5 BPM">+5</button>
          </div>

          <!-- Slider de BPM -->
          <input
            type="range"
            min="30"
            max="260"
            :value="metronomeStore.bpm"
            @input="e => metronomeStore.setBpm(Number((e.target as HTMLInputElement).value))"
            class="bpm-slider"
          />

          <!-- Botão TAP TEMPO -->
          <div class="tap-row">
            <button
              class="tap-btn"
              :class="{ 'tapping-anim': isTapping }"
              @click="handleTap"
              title="Clique no ritmo desejado para calibrar o BPM"
            >
              👆 TAP TEMPO
            </button>
            <span class="tap-hint">Toque no compasso da música</span>
          </div>
        </div>

        <!-- Batidas por Compasso -->
        <div class="config-section">
          <div class="section-label-row">
            <span class="section-label">Batidas por Compasso:</span>
            <span class="current-meter-tag">{{ metronomeStore.beatsPerMeasure > 1 ? `${metronomeStore.beatsPerMeasure}/4` : 'Sem acento' }}</span>
          </div>
          <div class="meter-chips">
            <button
              v-for="preset in meterPresets"
              :key="preset"
              class="meter-chip"
              :class="{ 'active': metronomeStore.beatsPerMeasure === preset }"
              @click="metronomeStore.setBeatsPerMeasure(preset)"
            >
              {{ preset === 1 ? '1 (Livre)' : `${preset}/4` }}
            </button>
            
            <div class="meter-stepper">
              <button class="step-sm-btn" @click="metronomeStore.setBeatsPerMeasure(metronomeStore.beatsPerMeasure - 1)" :disabled="metronomeStore.beatsPerMeasure <= 1">-</button>
              <span class="meter-stepper-val">{{ metronomeStore.beatsPerMeasure }}</span>
              <button class="step-sm-btn" @click="metronomeStore.setBeatsPerMeasure(metronomeStore.beatsPerMeasure + 1)" :disabled="metronomeStore.beatsPerMeasure >= 12">+</button>
            </div>
          </div>
        </div>

        <!-- Variações de Som -->
        <div class="config-section">
          <div class="section-label-row">
            <span class="section-label">Timbre / Som:</span>
          </div>
          <div class="sounds-grid">
            <button
              v-for="snd in soundOptions"
              :key="snd.value"
              class="sound-btn"
              :class="{ 'active': metronomeStore.soundType === snd.value }"
              @click="metronomeStore.setSoundType(snd.value)"
            >
              <span class="sound-icon">{{ snd.icon }}</span>
              <span class="sound-name">{{ snd.label }}</span>
            </button>
          </div>
        </div>

        <!-- Volume do Metrônomo -->
        <div class="volume-section">
          <span class="vol-icon" @click="toggleMute" title="Mutar / Ativar som">
            {{ metronomeStore.volume === 0 ? '🔇' : (metronomeStore.volume < 50 ? '🔉' : '🔊') }}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            :value="metronomeStore.volume"
            @input="e => metronomeStore.setVolume(Number((e.target as HTMLInputElement).value))"
            class="vol-slider"
          />
          <span class="vol-percent">{{ metronomeStore.volume }}%</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.metronome-widget {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
  margin-top: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.metronome-widget.is-playing {
  border-color: #ffe500;
  background: #fffdf0;
  box-shadow: 0 2px 10px rgba(255, 229, 0, 0.2);
}

.metronome-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.metronome-icon {
  font-size: 1.3rem;
  transition: transform 0.2s ease;
}

.icon-pulse {
  animation: pulse-icon 0.6s infinite alternate ease-in-out;
}

@keyframes pulse-icon {
  from { transform: scale(1); }
  to { transform: scale(1.15) rotate(5deg); }
}

.header-titles {
  display: flex;
  flex-direction: column;
}

.title-text {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
}

.tempo-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-play-btn {
  background: #0f172a;
  color: #fff;
  border: none;
  border-radius: 20px;
  width: 32px;
  height: 32px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.mini-play-btn:hover {
  transform: scale(1.08);
  background: #000;
}

.mini-play-btn.playing {
  background: #ef4444;
  color: white;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}

.collapse-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.collapse-btn:hover {
  color: #0f172a;
  background: #e2e8f0;
}

/* Beat Visualizer */
.beat-visualizer {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  justify-content: center;
}

.beat-dot {
  flex: 1;
  max-width: 48px;
  height: 24px;
  border-radius: 6px;
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.08s ease;
}

.beat-num {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
}

.beat-dot.is-current {
  background: #22c55e;
  border-color: #16a34a;
  transform: scale(1.06);
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
}

.beat-dot.is-current .beat-num {
  color: #fff;
}

.beat-dot.is-current.is-accent {
  background: #ffe500;
  border-color: #eab308;
  box-shadow: 0 0 14px rgba(255, 229, 0, 0.8);
}

.beat-dot.is-current.is-accent .beat-num {
  color: #000;
  font-weight: 800;
}

/* Body / Expansível */
.metronome-body {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metronome-expand-enter-active,
.metronome-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.metronome-expand-enter-from,
.metronome-expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
}

.metronome-expand-enter-to,
.metronome-expand-leave-from {
  opacity: 1;
  max-height: 600px;
}

/* BPM Section */
.bpm-control-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
}

.bpm-display-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bpm-center-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bpm-number {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

.bpm-sublabel {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 600;
}

.step-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}

.step-btn:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.step-btn.small {
  padding: 4px 6px;
}

.bpm-slider {
  width: 100%;
  accent-color: #0f172a;
  cursor: pointer;
  height: 6px;
  margin-top: 2px;
}

.tap-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.tap-btn {
  background: #0f172a;
  color: #ffe500;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s ease, background 0.15s ease;
  user-select: none;
}

.tap-btn:hover {
  background: #1e293b;
}

.tap-btn.tapping-anim {
  transform: scale(0.92);
  background: #ffe500;
  color: #000;
}

.tap-hint {
  font-size: 0.68rem;
  color: #94a3b8;
}

/* Config Sections */
.config-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
}

.current-meter-tag {
  font-size: 0.7rem;
  font-weight: 600;
  color: #0284c7;
}

.meter-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.meter-chip {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.meter-chip:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.meter-chip.active {
  background: #0f172a;
  color: #ffe500;
  border-color: #0f172a;
  font-weight: 700;
}

.meter-stepper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 2px 4px;
}

.step-sm-btn {
  background: #f1f5f9;
  border: none;
  border-radius: 4px;
  width: 20px;
  height: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
}

.step-sm-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.meter-stepper-val {
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 14px;
  text-align: center;
}

/* Sound Grid */
.sounds-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.sound-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sound-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.sound-btn.active {
  background: #0f172a;
  border-color: #0f172a;
}

.sound-btn.active .sound-name {
  color: #ffe500;
  font-weight: 700;
}

.sound-icon {
  font-size: 0.95rem;
}

.sound-name {
  font-size: 0.68rem;
  font-weight: 600;
  color: #334155;
}

/* Volume Slider */
.volume-section {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 10px;
}

.vol-icon {
  cursor: pointer;
  font-size: 0.95rem;
  user-select: none;
}

.vol-slider {
  flex: 1;
  accent-color: #0f172a;
  height: 4px;
  cursor: pointer;
}

.vol-percent {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
  min-width: 32px;
  text-align: right;
}
</style>
