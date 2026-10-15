<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { useStreakStore } from '@/stores/streak'
import { useRoutineStore } from '@/stores/routine'
import { useVoiceCoach } from '@/composables/useVoiceCoach'
import { playCelebrationSound } from '@/lib/celebrationSound'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const streakStore = useStreakStore()
const routineStore = useRoutineStore()
const voiceCoach = useVoiceCoach()

const cardRef = ref<HTMLElement | null>(null)
const particlesContainerRef = ref<HTMLElement | null>(null)
const autoCloseTimer = ref<number | null>(null)
const autoCloseProgress = ref(100)

// Confetti particle definitions
interface Particle {
  id: number
  type: 'confetti' | 'emoji' | 'balloon'
  char?: string
  color?: string
  x: number
  y: number
  size: number
}

const particles = ref<Particle[]>([])

const EMOJIS = ['🎉', '🎈', '🎤', '🎵', '🎶', '✨', '🌟', '🎊']
const CONFETTI_COLORS = ['#ffe500', '#22c55e', '#3b82f6', '#ec4899', '#a855f7', '#06b6d4', '#f97316']

function generateParticles() {
  const list: Particle[] = []

  // 1. Floating balloons
  for (let i = 0; i < 7; i++) {
    list.push({
      id: i,
      type: 'balloon',
      char: '🎈',
      x: 10 + i * 13 + (Math.random() * 6 - 3),
      y: 100 + Math.random() * 20,
      size: 28 + Math.floor(Math.random() * 16),
    })
  }

  // 2. Flying emojis around center
  for (let i = 0; i < 16; i++) {
    list.push({
      id: 100 + i,
      type: 'emoji',
      char: EMOJIS[i % EMOJIS.length],
      x: 50 + (Math.random() * 30 - 15),
      y: 50 + (Math.random() * 30 - 15),
      size: 22 + Math.floor(Math.random() * 14),
    })
  }

  // 3. Colorful confetti pieces
  for (let i = 0; i < 35; i++) {
    list.push({
      id: 200 + i,
      type: 'confetti',
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      x: 50 + (Math.random() * 20 - 10),
      y: 50 + (Math.random() * 20 - 10),
      size: 8 + Math.floor(Math.random() * 8),
    })
  }

  particles.value = list
}

function handleClose() {
  if (autoCloseTimer.value) {
    clearInterval(autoCloseTimer.value)
    autoCloseTimer.value = null
  }
  emit('close')
}

function handlePlaySoundAgain() {
  playCelebrationSound()
  voiceCoach.speak('Treino concluído!')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' || e.key === 'Enter') {
    handleClose()
  }
}

onMounted(() => {
  generateParticles()

  // Reproduz som de efeito da celebração
  playCelebrationSound()

  // Anuncia com Voice Coach se habilitado
  setTimeout(() => {
    voiceCoach.speak('Treino concluído!')
  }, 500)

  // Animação de entrada do card central
  if (cardRef.value) {
    gsap.fromTo(
      cardRef.value,
      { scale: 0.3, opacity: 0, y: 40 },
      { scale: 1, opacity: 1, y: 0, duration: 0.65, ease: 'back.out(1.8)' }
    )
  }

  // Animação dos confetes e emojis voando
  setTimeout(() => {
    if (!particlesContainerRef.value) return
    const particleElements = particlesContainerRef.value.querySelectorAll('.particle-item')

    particleElements.forEach((el) => {
      const isBalloon = el.classList.contains('particle-balloon')
      if (isBalloon) {
        // Balões sobem verticalmente com leve oscilação
        gsap.to(el, {
          y: -window.innerHeight - 150,
          x: '+=30',
          rotation: Math.random() * 20 - 10,
          duration: 4.5 + Math.random() * 3,
          ease: 'power1.out',
          repeat: -1,
          delay: Math.random() * 1.5,
        })
      } else {
        // Confetes e emojis explodem do centro em 360°
        const angle = Math.random() * Math.PI * 2
        const distance = 120 + Math.random() * (Math.min(window.innerWidth, window.innerHeight) * 0.45)
        const destX = Math.cos(angle) * distance
        const destY = Math.sin(angle) * distance

        gsap.to(el, {
          x: destX,
          y: destY,
          rotation: Math.random() * 720 - 360,
          opacity: 0,
          scale: 0.8 + Math.random() * 0.8,
          duration: 2.2 + Math.random() * 1.5,
          ease: 'power2.out',
        })
      }
    })
  }, 50)

  // Barra de progresso para auto-fechar em 8 segundos
  const DURATION_MS = 8000
  const INTERVAL_MS = 50
  let elapsed = 0
  autoCloseTimer.value = window.setInterval(() => {
    elapsed += INTERVAL_MS
    autoCloseProgress.value = Math.max(0, 100 - (elapsed / DURATION_MS) * 100)
    if (elapsed >= DURATION_MS) {
      handleClose()
    }
  }, INTERVAL_MS)

  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (autoCloseTimer.value) {
    clearInterval(autoCloseTimer.value)
    autoCloseTimer.value = null
  }
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    class="celebration-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Treino concluído"
    @click.self="handleClose"
  >
    <!-- Ondas sonar concêntricas radiantes -->
    <div class="sonar-ring sonar-ring-1"></div>
    <div class="sonar-ring sonar-ring-2"></div>
    <div class="sonar-ring sonar-ring-3"></div>

    <!-- Partículas animadas de confete, balões e notas -->
    <div ref="particlesContainerRef" class="particles-layer" aria-hidden="true">
      <div
        v-for="p in particles"
        :key="p.id"
        class="particle-item"
        :class="{
          'particle-balloon': p.type === 'balloon',
          'particle-emoji': p.type === 'emoji',
          'particle-confetti': p.type === 'confetti',
        }"
        :style="{
          left: `${p.x}%`,
          top: `${p.y}%`,
          fontSize: p.type !== 'confetti' ? `${p.size}px` : undefined,
          width: p.type === 'confetti' ? `${p.size}px` : undefined,
          height: p.type === 'confetti' ? `${p.size * 1.5}px` : undefined,
          backgroundColor: p.color,
        }"
      >
        <span v-if="p.char">{{ p.char }}</span>
      </div>
    </div>

    <!-- Card centralizado na tela -->
    <div ref="cardRef" class="celebration-card">
      <button
        type="button"
        class="close-btn"
        aria-label="Fechar celebração"
        @click="handleClose"
      >
        ✕
      </button>

      <!-- Badge de conquista superior -->
      <div class="conquest-badge">
        <span class="badge-icon">🏆</span>
        <span>MISSÃO DIÁRIA CUMPRIDA</span>
      </div>

      <!-- Título principal exatamente como solicitado -->
      <h2 class="celebration-title">Treino concluído 🎉🎈🎤</h2>

      <p class="celebration-subtitle">
        Parabéns! Você completou com sucesso todas as seções da sua rotina vocal de hoje.
      </p>

      <!-- Grade de estatísticas da sessão -->
      <div class="stats-row">
        <div class="stat-box">
          <span class="stat-value">{{ routineStore.nodes.length }} / {{ routineStore.nodes.length }}</span>
          <span class="stat-label">Seções Concluídas</span>
        </div>
        <div class="stat-box accent">
          <span class="stat-value">🔥 {{ streakStore.currentStreak }}</span>
          <span class="stat-label">{{ streakStore.currentStreak === 1 ? 'Dia de ofensiva' : 'Dias seguidos' }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-value">100%</span>
          <span class="stat-label">Progresso Geral</span>
        </div>
      </div>

      <div class="encouragement-banner">
        <span>🌟</span>
        <p>Sua musculatura e ressonância agradecem pela consistência e foco diário!</p>
      </div>

      <!-- Ações do usuário -->
      <div class="actions-row">
        <button
          type="button"
          class="replay-sound-btn"
          title="Tocar som de vitória novamente"
          @click="handlePlaySoundAgain"
        >
          <span>🔔</span>
          <span>Tocar Som</span>
        </button>

        <button
          type="button"
          class="continue-btn"
          @click="handleClose"
        >
          <span>Continuar</span>
          <span class="arrow">🚀</span>
        </button>
      </div>

      <!-- Barra de progresso para auto-close -->
      <div class="auto-close-bar-track" title="Fechamento automático">
        <div class="auto-close-bar-fill" :style="{ width: `${autoCloseProgress}%` }"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.celebration-overlay {
  position: fixed;
  inset: 0;
  z-index: 12000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(8, 8, 22, 0.85);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  overflow: hidden;
  animation: overlayFadeIn 0.35s ease-out;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Ondas sonar concêntricas radiantes no fundo */
.sonar-ring {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  pointer-events: none;
  border: 2px solid rgba(255, 229, 0, 0.3);
  animation: sonarPulse 3s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
}

.sonar-ring-2 {
  border-color: rgba(34, 197, 94, 0.35);
  animation-delay: 1s;
}

.sonar-ring-3 {
  border-color: rgba(139, 92, 246, 0.3);
  animation-delay: 2s;
}

@keyframes sonarPulse {
  0% {
    transform: scale(0.4);
    opacity: 0.8;
  }
  100% {
    transform: scale(2.8);
    opacity: 0;
  }
}

/* Camada de partículas */
.particles-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.particle-item {
  position: absolute;
  pointer-events: none;
  user-select: none;
  transform: translate(-50%, -50%);
}

.particle-confetti {
  border-radius: 3px;
  box-shadow: 0 0 8px currentColor;
}

.particle-balloon {
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4));
}

/* Card centralizado */
.celebration-card {
  position: relative;
  width: 100%;
  max-width: 490px;
  background: rgba(20, 20, 45, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1.5px solid rgba(255, 229, 0, 0.35);
  box-shadow:
    0 0 50px rgba(255, 229, 0, 0.2),
    0 0 80px rgba(34, 197, 94, 0.15),
    0 25px 60px rgba(0, 0, 0, 0.6);
  padding: 32px 28px 24px;
  text-align: center;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  overflow: hidden;
}

/* Botão de fechar (X) */
.close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #94a3b8;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #f8fafc;
  transform: scale(1.08);
}

/* Badge de conquista */
.conquest-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 229, 0, 0.12);
  border: 1px solid rgba(255, 229, 0, 0.3);
  color: #ffe500;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 6px 14px;
  border-radius: 20px;
  text-transform: uppercase;
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 229, 0, 0.4);
  }
  50% {
    box-shadow: 0 0 16px 2px rgba(255, 229, 0, 0.2);
  }
}

.badge-icon {
  font-size: 0.95rem;
}

/* Título principal solicitado */
.celebration-title {
  margin: 0;
  font-size: clamp(1.25rem, 5vw, 2rem);
  font-weight: 800;
  line-height: 1.2;
  background: linear-gradient(135deg, #ffe500 0%, #4ade80 50%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 14px rgba(255, 229, 0, 0.3));
}

.celebration-subtitle {
  margin: 0;
  font-size: 0.92rem;
  color: #cbd5e1;
  line-height: 1.5;
  max-width: 400px;
}

/* Grade de estatísticas */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
  margin: 4px 0;
}

.stat-box {
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 12px 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.stat-box.accent {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.08);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #f8fafc;
}

.stat-box.accent .stat-value {
  color: #4ade80;
}

.stat-label {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Banner de incentivo */
.encouragement-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(139, 92, 246, 0.12);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 12px;
  padding: 10px 14px;
  width: 100%;
  box-sizing: border-box;
  text-align: left;
}

.encouragement-banner span {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.encouragement-banner p {
  margin: 0;
  font-size: 0.8rem;
  color: #e2e8f0;
  line-height: 1.4;
}

/* Linha de ações */
.actions-row {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 6px;
}

.replay-sound-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #e2e8f0;
  font-weight: 600;
  font-size: 0.88rem;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.replay-sound-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.continue-btn {
  flex: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #ffe500 0%, #22c55e 100%);
  border: none;
  color: #080816;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 12px 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 18px rgba(34, 197, 94, 0.35);
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(34, 197, 94, 0.5);
  filter: brightness(1.06);
}

.continue-btn:active {
  transform: translateY(0);
}

.arrow {
  transition: transform 0.2s ease;
}

.continue-btn:hover .arrow {
  transform: translateX(3px) scale(1.15);
}

/* Barra de progresso do auto-fechar */
.auto-close-bar-track {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
}

.auto-close-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffe500, #22c55e);
  transition: width 0.05s linear;
}

/* Adaptações mobile */
@media (max-width: 480px) {
  .celebration-card {
    padding: 24px 18px 18px;
    gap: 12px;
    border-radius: 20px;
  }

  .celebration-title {
    font-size: 1.45rem;
  }

  .stat-value {
    font-size: 1.1rem;
  }

  .actions-row {
    flex-direction: column;
  }

  .continue-btn,
  .replay-sound-btn {
    width: 100%;
  }
}
</style>
