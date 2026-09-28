<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useRoutineStore } from '@/stores/routine'
import { useStreakStore } from '@/stores/streak'
import StreakPanel from '@/components/StreakPanel.vue'
import gsap from 'gsap'

const playerStore = usePlayerStore()
const routineStore = useRoutineStore()
const streakStore = useStreakStore()

const toggleSidebarPosition = inject('toggleSidebarPosition') as () => void
const isHeaderExpanded = ref(true)

const animatingToggle = ref<string | null>(null)

function animateToggle(type: string) {
  animatingToggle.value = type
  setTimeout(() => {
    if (animatingToggle.value === type) animatingToggle.value = null
  }, 1000)
}

const activeNode = computed(() => playerStore.activeNode)
const activeExercise = computed(() => playerStore.activeExercise)

const progressPercent = computed(() => {
  const completed = routineStore.nodes.filter(n => n.completed).length
  return Math.round((completed / routineStore.nodes.length) * 100)
})

const completedCount = computed(() =>
  routineStore.nodes.filter(n => n.completed).length
)

function finishSession(): void {
  const completedIds = routineStore.nodes.filter(n => n.completed).map(n => n.id)
  streakStore.recordPractice(completedIds, routineStore.totalDuration)
  routineStore.resetDaily()
  playerStore.goTo(0)
  playerStore.isPlaying = false
}

function handleCompletedToggle() {
  animateToggle('success')
  if (activeNode.value && activeExercise.value) {
    routineStore.toggleExercise(activeNode.value.id, activeExercise.value.id)
  }
}

function createParticles(e: MouseEvent, emojis: string[]) {
  for (let i = 0; i < 4; i++) {
    const el = document.createElement('div')
    el.innerText = emojis[Math.floor(Math.random() * emojis.length)]!
    el.style.position = 'fixed'
    el.style.left = e.clientX + 'px'
    el.style.top = e.clientY + 'px'
    el.style.fontSize = '24px'
    el.style.pointerEvents = 'none'
    el.style.zIndex = '9999'
    document.body.appendChild(el)
    gsap.to(el, {
      y: -80 - Math.random() * 80,
      x: (Math.random() - 0.5) * 80,
      opacity: 0,
      scale: 1.5,
      rotation: (Math.random() - 0.5) * 45,
      duration: 1 + Math.random(),
      ease: "power2.out",
      onComplete: () => el.remove()
    })
  }
}

function handlePlayClick(e: MouseEvent) {
  playerStore.togglePlay()
  createParticles(e, ['🎼', '🎵', '🎶', '🎙️', '🎤'])
}

const embedUrl = computed(() => {
  const url = activeExercise.value?.videoUrl
  if (!url) return null
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0]
    return `https://www.youtube.com/embed/${videoId}`
  } else if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0]
    return `https://www.youtube.com/embed/${videoId}`
  }
  return url
})

const editNode = computed(() => {
  if (!playerStore.editModeNodeId) return null
  return routineStore.nodes.find(n => n.id === playerStore.editModeNodeId)
})

</script>

<template>
  <div class="player-sidebar">

    <!-- Collapsible Header -->
    <div class="app-header-collapsible">
      <div class="collapsible-header" :class="{ 'no-pointer': playerStore.editModeNodeId }" @click="!playerStore.editModeNodeId && (isHeaderExpanded = !isHeaderExpanded)">
        <h2 class="app-title">🎤 Trilha de Canto</h2>
        <div class="header-actions" v-if="!playerStore.editModeNodeId">
          <span class="chevron">{{ isHeaderExpanded ? '▲' : '▼' }}</span>
        </div>
      </div>
      <Transition name="expand">
        <div class="collapsible-content" v-show="isHeaderExpanded && !playerStore.editModeNodeId">
          <div class="side-actions">
            <button class="toggle-side-btn" @click.stop="toggleSidebarPosition">⇋ Trocar Lado</button>
          </div>
          <StreakPanel />
        </div>
      </Transition>
    </div>

    <!-- MODO DE EDIÇÃO -->
    <div v-if="playerStore.editModeNodeId" class="edit-mode-container">
      <div class="edit-header">
        <h3>Editar Seção: {{ editNode?.title }}</h3>
        <div class="edit-actions">
          <button class="add-ex-btn" @click="routineStore.addExercise(playerStore.editModeNodeId!, 'Novo Exercício')">+ Novo</button>
          <button class="close-edit-btn" @click="playerStore.editModeNodeId = null">✖️ Sair</button>
        </div>
      </div>
      <div class="edit-list">
        <div v-for="ex in editNode?.exercises" :key="ex.id" class="edit-card">
          <input class="edit-input" v-model="ex.name" placeholder="Nome do exercício" @change="routineStore.saveToStorage()" />
          <input class="edit-input url-input" v-model="ex.videoUrl" placeholder="URL do Vídeo (YouTube)" @change="routineStore.saveToStorage()" />
          <button class="delete-btn" @click="routineStore.removeExercise(playerStore.editModeNodeId!, ex.id)" title="Deletar">🗑️</button>
        </div>
      </div>
    </div>

    <!-- MODO PLAYER NORMAL -->
    <template v-else>
      <div class="sidebar-header">
        <div class="progress-section compact">
          <div class="progress-header">
            <span class="progress-text">Progresso Geral</span>
            <span class="progress-stats">{{ completedCount }} / {{ routineStore.nodes.length }} seções</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>

        <hr class="header-divider" />

        <div class="active-info">
          <span class="active-time" :class="{ 'completed-text': activeNode?.completed }">
            {{ activeNode?.title || 'Trilha' }}
            <span v-if="activeNode?.completed" class="floating-check">✅</span>
          </span>
          <span class="active-title" :class="{ 'completed-text': activeExercise?.completed }">
            {{ activeExercise?.name || 'Selecione um exercício no mapa' }}
            <span v-if="activeExercise?.completed" class="floating-check">✅</span>
          </span>
        </div>
      </div>

      <!-- Media container com espaço reservado sempre -->
      <section class="media-container" :class="{ 'completed-media': activeExercise?.completed }">
        <template v-if="activeExercise">
          <iframe
            v-if="embedUrl"
            class="video-frame"
            :src="embedUrl"
            frameborder="0"
            allow="autoplay; encrypted-media"
            allowfullscreen>
          </iframe>
          <div v-else class="text-description">
            <span class="tip-icon">💡</span>
            <p>{{ activeExercise.name }}</p>
          </div>
        </template>
        <div v-else class="text-description empty">
          <p>Aguardando seleção...</p>
        </div>
      </section>

      <div class="sidebar-body">

        <div class="controls-card" :class="{ 'completed-card': activeExercise?.completed }">
          <div class="player-controls">
            <button class="icon-btn" @click="(e) => { playerStore.prev(); createParticles(e, ['⏮️']) }" :disabled="playerStore.isFirstExercise">⏮</button>
            <button
              class="icon-btn play-btn"
              :class="{ 'completed-play': activeExercise?.completed }"
              @click="handlePlayClick"
            >
              {{ playerStore.isPlaying ? '⏸' : '▶' }}
            </button>
            <button class="icon-btn" @click="(e) => { playerStore.next(); createParticles(e, ['⏭️']) }" :disabled="playerStore.isLastExercise">⏭</button>
          </div>

          <div class="toggles">
            <label class="auto-toggle" :class="{ 'shake-anim': animatingToggle === 'auto' }">
              <input type="checkbox" class="native-checkbox neutral-checkbox" v-model="playerStore.autoAdvance" @change="animateToggle('auto')" />
              <span>Avançar automaticamente</span>
            </label>
            <label class="auto-toggle success-toggle" v-if="activeExercise" :class="{ 'shake-anim': animatingToggle === 'success' }">
              <input type="checkbox" class="native-checkbox green-checkbox" :checked="activeExercise.completed" @change="handleCompletedToggle" />
              <span>Marcar como Concluído</span>
            </label>
          </div>
        </div>

        <button v-if="routineStore.isAllCompleted" class="finish-btn" @click="finishSession">✅ Concluir Sessão Diária</button>

      </div>
    </template>
  </div>
</template>

<style scoped>
.player-sidebar {
  width: 100%;
  height: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

.app-header-collapsible {
  background: #ffffff;
  border-bottom: 2px solid #000;
}

.collapsible-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  transition: all 0.3s;
}

.collapsible-header:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
}

.no-pointer {
  cursor: default !important;
}

.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.4s ease, opacity 0.4s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 600px;
  opacity: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.close-edit-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.side-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.edit-mode-container {
  padding: 20px;
  background: #f8fafc;
  flex: 1;
  overflow-y: auto;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.edit-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #0f172a;
}

.edit-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.add-ex-btn {
  background: #22c55e;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.edit-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edit-card {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.edit-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.url-input {
  font-family: monospace;
  font-size: 0.85rem;
}

.delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  opacity: 0.6;
}

.delete-btn:hover {
  opacity: 1;
}

.toggle-side-btn {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 8px;
  color: #334155;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.toggle-side-btn:hover {
  background: #ffffff;
  color: #0f172a;
  border-color: #94a3b8;
  transform: scale(1.05);
}

.app-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #000;
  letter-spacing: -0.5px;
  margin: 0;
}

.chevron {
  font-size: 0.8rem;
  color: #64748b;
}

.collapsible-content {
    padding: 16px 20px;
    border-top: 1px solid #e2e8f0;
    background: #ffffff;
    display: flex;
    justify-content: space-around;
    gap: 24px;
    flex-direction: row;
    align-items: center;
}

.sidebar-header {
  padding: 24px 20px 16px 20px;
  background: #ffffff;
}

.header-divider {
  border: 0;
  border-top: 1px solid #e2e8f0;
  margin: 16px 0;
}

.active-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.active-time {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s;
}

.active-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s;
}

.completed-text {
  color: #22c55e !important;
}

.floating-check {
  display: inline-block;
  animation: floatCheck 2s ease-in-out infinite;
}

@keyframes floatCheck {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.media-container {
  background: #0f172a;
  width: 100%;
  aspect-ratio: 16 / 9; /* Espaço reservado para não pular */
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-bottom: 4px solid #ffe500;
  transition: border-color 0.3s;
}

.completed-media {
  border-bottom-color: #22c55e;
}

.video-frame {
  width: 100%;
  height: 100%;
}

.text-description {
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
  color: #f8fafc;
  font-weight: 600;
  font-size: 1.05rem;
  height: 100%;
}

.text-description.empty {
  opacity: 0.5;
}

.tip-icon {
  font-size: 2rem;
}

.sidebar-body {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
}

.controls-card {
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.completed-card {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
}

.player-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex: 1;
  min-width: 160px;
}

.icon-btn {
  background: #f8fafc;
  border: 2px solid #cbd5e1;
  color: #334155;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover:not(:disabled) {
  background: #e2e8f0;
  border-color: #cbd5e1;
  color: #0f172a;
  transform: translateY(-2px);
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.play-btn {
  background: #ffe500;
  color: #000;
  border-color: #d4b300;
  width: 60px;
  height: 60px;
  font-size: 1.5rem;
  box-shadow: 0 4px 0 #d4b300;
  transition: all 0.2s;
}

.play-btn:hover:not(:disabled) {
  background: #ffec33;
  transform: translateY(2px);
  box-shadow: 0 2px 0 #d4b300;
}

.completed-play {
  background: #22c55e !important;
  color: #fff !important;
  border-color: #16a34a !important;
  box-shadow: 0 4px 0 #16a34a !important;
}

.completed-play:hover:not(:disabled) {
  background: #4ade80 !important;
  box-shadow: 0 2px 0 #16a34a !important;
}

.toggles {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
  flex: 1;
  min-width: 180px;
}

.auto-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: #334155;
  font-weight: 700;
  cursor: pointer;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px) rotate(-2deg); }
  75% { transform: translateX(4px) rotate(2deg); }
}

@keyframes pulse-text {
  0% { transform: scale(1); color: inherit; }
  50% { transform: scale(1.05); color: #000; }
  100% { transform: scale(1); color: inherit; }
}

.shake-anim {
  animation: shake 0.4s ease-in-out;
}

.shake-anim span {
  display: inline-block;
  animation: pulse-text 1s ease;
}

.success-toggle {
  color: #16a34a;
}

.native-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #ffe500;
  cursor: pointer;
}

.neutral-checkbox {
  accent-color: #475569 !important;
}

.green-checkbox {
  accent-color: #22c55e;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-text {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
}

.progress-stats {
  font-size: 0.9rem;
  font-weight: 800;
  color: #0f172a;
}

.progress-bar-bg {
  height: 12px;
  background: #f1f5f9;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffe500, #22c55e);
  transition: width 0.5s ease;
}

.finish-btn {
  background: #22c55e;
  color: #ffffff;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 0 #16a34a;
  margin-top: auto;
}

.finish-btn:hover {
  background: #4ade80;
  transform: translateY(2px);
  box-shadow: 0 2px 0 #16a34a;
}
</style>
