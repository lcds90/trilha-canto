<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMetronomeStore } from '@/stores/metronome'
import type { MetronomeSoundType } from '@/types'

const metronomeStore = useMetronomeStore()

const isTapping = ref(false)
const showSettings = ref(false)
const previousVolume = ref(80)

const soundOptions: { label: string; value: MetronomeSoundType; icon: string }[] = [
  { label: 'Madeira', value: 'woodblock', icon: '🪵' },
  { label: 'Digital', value: 'beep', icon: '🔔' },
  { label: 'Baqueta', value: 'stick', icon: '🥢' },
  { label: 'Cowbell', value: 'cowbell', icon: '🪇' },
  { label: 'Pop', value: 'pop', icon: '🫧' }
]

const meterPresets = [1, 2, 3, 4, 6]

const isPracticing = computed(() => metronomeStore.isPlaying || metronomeStore.isTimerRunning)

function handleTap() {
  isTapping.value = true
  metronomeStore.tapTempo()
  setTimeout(() => {
    isTapping.value = false
  }, 180)
}

function handleTogglePractice() {
  if (isPracticing.value) {
    metronomeStore.pauseTimer(true)
    metronomeStore.stop()
  } else {
    metronomeStore.startTimer(true)
  }
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
  <div class="unified-practice-widget">
    <!-- Card Único Unificado: Metrônomo & Temporizador -->
    <div class="unified-card" :class="{ 'is-active': isPracticing }">
      <!-- 1. Header do Card -->
      <div class="card-header">
        <div class="header-left">
          <span class="header-icon" :class="{ 'pulse-anim': isPracticing }">⏱️</span>
          <div class="header-titles">
            <span class="header-title">Metrônomo & Temporizador</span>
            <span class="header-sub" v-if="isPracticing">
              {{ metronomeStore.timerDuration > 0 ? 'Conclui e avança ao zerar' : 'Modo livre ativo' }}
            </span>
            <span class="header-sub" v-else>Prática vocal sincronizada</span>
          </div>
        </div>

        <div class="header-actions">
          <!-- Reset do tempo -->
          <button
            type="button"
            class="action-icon-btn"
            @click="metronomeStore.resetTimer()"
            title="Reiniciar tempo"
            :disabled="metronomeStore.timerRemaining === metronomeStore.timerDuration"
          >
            ↺
          </button>

          <!-- Drawer de Configurações ⚙️ -->
          <button
            type="button"
            class="action-icon-btn"
            :class="{ 'is-open': showSettings }"
            @click="showSettings = !showSettings"
            title="Ajustar sons, compasso e volume"
          >
            ⚙️
          </button>

          <!-- Botão Play / Stop Unificado -->
          <button
            type="button"
            class="main-toggle-btn"
            :class="{ 'active': isPracticing }"
            @click="handleTogglePractice"
            :title="isPracticing ? 'Parar prática (M ou T)' : 'Iniciar prática (M ou T)'"
          >
            <span class="btn-icon">{{ isPracticing ? '⏹' : '▶' }}</span>
            <span class="btn-text">{{ isPracticing ? 'Parar' : 'Iniciar' }}</span>
          </button>
        </div>
      </div>

      <!-- 2. Painel Central Dividido (Metrônomo à Esquerda / Timer à Direita) -->
      <div class="dashboard-grid">
        <!-- Coluna Metrônomo -->
        <div class="dashboard-col metronome-section">
          <div class="metric-block">
            <div class="metric-top-row">
              <span class="metric-val">{{ metronomeStore.bpm }}</span>
              <span class="bpm-unit">BPM</span>
              <span class="tempo-tag">{{ metronomeStore.tempoMarking }}</span>
            </div>

            <!-- Steppers do BPM e TAP -->
            <div class="steppers-row">
              <button type="button" class="micro-btn" @click="metronomeStore.incrementBpm(-5)" title="-5 BPM">-5</button>
              <button
                type="button"
                class="tap-btn"
                :class="{ 'is-tapping': isTapping }"
                @click="handleTap"
                title="Toque no ritmo para calibrar o BPM"
              >
                TAP
              </button>
              <button type="button" class="micro-btn" @click="metronomeStore.incrementBpm(5)" title="+5 BPM">+5</button>
            </div>

            <!-- Slider sutil de BPM -->
            <input
              type="range"
              min="30"
              max="260"
              :value="metronomeStore.bpm"
              @input="e => metronomeStore.setBpm(Number((e.target as HTMLInputElement).value))"
              class="minimal-slider bpm-slider"
            />

            <!-- Visualizador de Batidas (Dots) -->
            <div class="beat-dots-row">
              <div
                v-for="b in metronomeStore.beatsPerMeasure"
                :key="b"
                class="minimal-beat-dot"
                :class="{
                  'is-current': metronomeStore.isPlaying && metronomeStore.currentBeat === b,
                  'is-accent': b === 1 && metronomeStore.beatsPerMeasure > 1
                }"
              ></div>
            </div>
          </div>
        </div>

        <div class="col-divider"></div>

        <!-- Coluna Temporizador -->
        <div class="dashboard-col timer-section">
          <div class="metric-block">
            <div class="metric-top-row">
              <span class="metric-val timer-val" :class="{ 'ticking': metronomeStore.isTimerRunning }">
                {{ metronomeStore.timerRemainingFormatted }}
              </span>
              <div class="timer-steppers">
                <button
                  type="button"
                  class="micro-btn"
                  @click="metronomeStore.adjustTimer(-15)"
                  title="-15s"
                  :disabled="metronomeStore.timerDuration <= 15"
                >-15s</button>
                <button
                  type="button"
                  class="micro-btn"
                  @click="metronomeStore.adjustTimer(15)"
                  title="+15s"
                >+15s</button>
              </div>
            </div>

            <!-- Presets de Duração -->
            <div class="presets-row">
              <button
                type="button"
                class="preset-chip"
                :class="{ active: metronomeStore.timerDuration === 30 }"
                @click="metronomeStore.setTimerDuration(30)"
              >30s</button>
              <button
                type="button"
                class="preset-chip"
                :class="{ active: metronomeStore.timerDuration === 60 }"
                @click="metronomeStore.setTimerDuration(60)"
              >1m</button>
              <button
                type="button"
                class="preset-chip"
                :class="{ active: metronomeStore.timerDuration === 120 }"
                @click="metronomeStore.setTimerDuration(120)"
              >2m</button>
              <button
                type="button"
                class="preset-chip"
                :class="{ active: metronomeStore.timerDuration === 180 }"
                @click="metronomeStore.setTimerDuration(180)"
              >3m</button>
              <button
                type="button"
                class="preset-chip"
                :class="{ active: metronomeStore.timerDuration === 300 }"
                @click="metronomeStore.setTimerDuration(300)"
              >5m</button>
              <button
                type="button"
                class="preset-chip"
                :class="{ active: metronomeStore.timerDuration === 0 }"
                @click="metronomeStore.setTimerDuration(0)"
                title="Modo Livre (sem parada automática)"
              >∞</button>
            </div>

            <!-- Barra de Progresso do Tempo -->
            <div class="timer-track-row">
              <div class="timer-track">
                <div
                  class="timer-progress"
                  :style="{ width: metronomeStore.timerProgress + '%' }"
                  :class="{ 'is-running': metronomeStore.isTimerRunning }"
                ></div>
              </div>
              <span class="timer-sub-text">
                {{ metronomeStore.timerDuration > 0 ? `Total: ${metronomeStore.timerDurationFormatted}` : 'Livre' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Gaveta Retrátil de Configurações ⚙️ -->
      <Transition name="fade-slide">
        <div v-show="showSettings" class="settings-drawer">
          <div class="drawer-header">
            <span class="drawer-title">Ajustes de Áudio e Compasso</span>
            <button type="button" class="drawer-close" @click="showSettings = false">✕</button>
          </div>

          <!-- Compasso -->
          <div class="setting-item">
            <span class="setting-label">Compasso:</span>
            <div class="chips-list">
              <button
                v-for="preset in meterPresets"
                :key="preset"
                type="button"
                class="drawer-chip"
                :class="{ active: metronomeStore.beatsPerMeasure === preset }"
                @click="metronomeStore.setBeatsPerMeasure(preset)"
              >
                {{ preset === 1 ? '1/1' : `${preset}/4` }}
              </button>
            </div>
          </div>

          <!-- Timbres / Sons -->
          <div class="setting-item">
            <span class="setting-label">Timbre:</span>
            <div class="chips-list">
              <button
                v-for="snd in soundOptions"
                :key="snd.value"
                type="button"
                class="drawer-chip"
                :class="{ active: metronomeStore.soundType === snd.value }"
                @click="metronomeStore.setSoundType(snd.value)"
              >
                <span>{{ snd.icon }}</span>
                <span>{{ snd.label }}</span>
              </button>
            </div>
          </div>

          <!-- Volume e Sincronização -->
          <div class="setting-item volume-row">
            <span class="vol-icon" @click="toggleMute" title="Mutar/Desmutar">
              {{ metronomeStore.volume === 0 ? '🔇' : (metronomeStore.volume < 50 ? '🔉' : '🔊') }}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              :value="metronomeStore.volume"
              @input="e => metronomeStore.setVolume(Number((e.target as HTMLInputElement).value))"
              class="minimal-slider flex-1"
            />
            <span class="vol-num">{{ metronomeStore.volume }}%</span>

            <button
              type="button"
              class="sync-chip"
              :class="{ active: metronomeStore.syncWithMetronome }"
              @click="metronomeStore.setSyncWithMetronome(!metronomeStore.syncWithMetronome)"
              :title="metronomeStore.syncWithMetronome ? 'Metrônomo toca com o temporizador' : 'Temporizador roda mudo'"
            >
              {{ metronomeStore.syncWithMetronome ? '⏱️ Sinc' : '🔕 Mudo' }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.unified-practice-widget {
  width: 100%;
}

.unified-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.25s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

.unified-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
}

.unified-card.is-active {
  border-color: #ffe500;
  background: #fffdf5;
  box-shadow: 0 2px 10px rgba(255, 229, 0, 0.15);
}

/* ============ Header ============ */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.header-icon {
  font-size: 1.15rem;
  line-height: 1;
}

.header-titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.header-title {
  font-size: 0.82rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.2px;
  white-space: nowrap;
}

.header-sub {
  font-size: 0.68rem;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.action-icon-btn {
  background: transparent;
  border: none;
  font-size: 0.95rem;
  color: #64748b;
  cursor: pointer;
  padding: 3px 5px;
  border-radius: 6px;
  transition: all 0.15s;
  line-height: 1;
}

.action-icon-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}

.action-icon-btn.is-open {
  background: #e2e8f0;
  color: #0f172a;
}

.action-icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.main-toggle-btn {
  background: #0f172a;
  color: #ffffff;
  border: 1px solid #0f172a;
  border-radius: 8px;
  padding: 4px 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.main-toggle-btn:hover {
  background: #334155;
  transform: translateY(-1px);
}

.main-toggle-btn.active {
  background: #ffe500;
  border-color: #d4b300;
  color: #000000;
  box-shadow: 0 1px 4px rgba(212, 179, 0, 0.4);
}

.btn-icon {
  font-size: 0.8rem;
  line-height: 1;
}

/* ============ Dashboard Grid (Metrônomo | Temporizador) ============ */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
}

@media (max-width: 320px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .col-divider {
    display: none;
  }
}

.col-divider {
  width: 1px;
  height: 80%;
  background: #e2e8f0;
}

.dashboard-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.metric-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-top-row {
  display: flex;
  align-items: baseline;
  gap: 5px;
  flex-wrap: wrap;
}

.metric-val {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
}

.bpm-unit {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
}

.tempo-tag {
  font-size: 0.65rem;
  font-weight: 700;
  color: #475569;
  background: #e2e8f0;
  padding: 1px 5px;
  border-radius: 4px;
  margin-left: auto;
}

.timer-val {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 1.4rem;
}

.timer-val.ticking {
  animation: tickPulse 1s infinite ease-in-out;
}

@keyframes tickPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

.timer-steppers {
  display: flex;
  gap: 2px;
  margin-left: auto;
}

/* Steppers e TAP */
.steppers-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.micro-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  padding: 2px 6px;
  font-size: 0.68rem;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  line-height: 1.2;
  transition: all 0.15s;
}

.micro-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}

.micro-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.tap-btn {
  background: #0f172a;
  color: #f8fafc;
  border: none;
  border-radius: 5px;
  padding: 3px 8px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: transform 0.1s ease, background 0.15s ease;
  line-height: 1.2;
}

.tap-btn:hover {
  background: #334155;
}

.tap-btn.is-tapping {
  transform: scale(0.92);
  background: #ffe500;
  color: #000;
}

/* Slider */
.minimal-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #e2e8f0;
  accent-color: #0f172a;
  cursor: pointer;
  margin: 1px 0;
}

/* Beat dots */
.beat-dots-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 10px;
}

.minimal-beat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cbd5e1;
  transition: all 0.1s ease;
}

.minimal-beat-dot.is-accent {
  background: #94a3b8;
}

.minimal-beat-dot.is-current {
  background: #22c55e;
  transform: scale(1.4);
  box-shadow: 0 0 5px rgba(34, 197, 94, 0.8);
}

.minimal-beat-dot.is-accent.is-current {
  background: #ffe500;
  transform: scale(1.6);
  box-shadow: 0 0 6px rgba(255, 229, 0, 0.9);
}

/* Presets do Timer */
.presets-row {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}

.preset-chip {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 0.65rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1.2;
}

.preset-chip:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.preset-chip.active {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}

/* Timer progress */
.timer-track-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.timer-track {
  flex: 1;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.timer-progress {
  height: 100%;
  background: #3b82f6;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.timer-progress.is-running {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.timer-sub-text {
  font-size: 0.65rem;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
}

/* ============ Settings Drawer ============ */
.settings-drawer {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.drawer-close {
  background: transparent;
  border: none;
  font-size: 0.8rem;
  color: #64748b;
  cursor: pointer;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.setting-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  min-width: 60px;
}

.chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.drawer-chip {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  padding: 2px 6px;
  font-size: 0.68rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  transition: all 0.15s;
}

.drawer-chip:hover {
  background: #f1f5f9;
}

.drawer-chip.active {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}

.volume-row {
  flex-wrap: nowrap;
}

.vol-icon {
  font-size: 0.9rem;
  cursor: pointer;
}

.vol-num {
  font-size: 0.7rem;
  font-weight: 700;
  color: #475569;
  min-width: 30px;
  text-align: right;
}

.sync-chip {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  padding: 2px 6px;
  font-size: 0.68rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  margin-left: 4px;
}

.sync-chip.active {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #2563eb;
}

.flex-1 {
  flex: 1;
}

/* Animations */
.pulse-anim {
  animation: pulse-icon 1.2s infinite ease-in-out;
}

@keyframes pulse-icon {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
