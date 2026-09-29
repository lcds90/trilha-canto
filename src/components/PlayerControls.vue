<script setup lang="ts">
import { computed, inject, ref, watch, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useRoutineStore } from '@/stores/routine'
import { useStreakStore } from '@/stores/streak'
import { useAuthStore } from '@/stores/auth'
import StreakPanel from '@/components/StreakPanel.vue'
import YouTubePlayer from '@/components/YouTubePlayer.vue'
import DailyAdvice from '@/components/DailyAdvice.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import gsap from 'gsap'
import type { VideoMedia } from '@/types'

const playerStore = usePlayerStore()
const routineStore = useRoutineStore()
const streakStore = useStreakStore()
const authStore = useAuthStore()

const toggleSidebarPosition = inject('toggleSidebarPosition') as () => void
const isHeaderExpanded = ref(true)
const hasNewTip = ref(true)
watch(isHeaderExpanded, (val) => {
  if (val) hasNewTip.value = false
})

const shortcutsEnabled = ref(localStorage.getItem('trilha-canto-shortcuts') !== 'false')
watch(shortcutsEnabled, (val) => {
  localStorage.setItem('trilha-canto-shortcuts', val.toString())
})

const animatingToggle = ref<string | null>(null)
const previousVolume = ref(100)

function toggleMute() {
  if (playerStore.videoVolume > 0) {
    previousVolume.value = playerStore.videoVolume
    playerStore.videoVolume = 0
  } else {
    playerStore.videoVolume = previousVolume.value || 100
  }
}
let ytPlayerInstance: any = null

function animateToggle(type: string) {
  animatingToggle.value = type
  setTimeout(() => {
    if (animatingToggle.value === type) animatingToggle.value = null
  }, 1000)
}

const activeNode = computed(() => playerStore.activeNode)
const activeExercise = computed(() => playerStore.activeExercise)
const currentVideo = computed(() => playerStore.currentVideo)

const progressPercent = computed(() => {
  const total = routineStore.nodes.length
  if (total === 0) return 0
  const completed = routineStore.nodes.filter(n => n.completed).length
  return Math.round((completed / total) * 100)
})

const completedCount = computed(() =>
  routineStore.nodes.filter(n => n.completed).length
)

watch(() => routineStore.isAllCompleted, (isAllCompleted) => {
  if (isAllCompleted) {
    const completedIds = routineStore.nodes.filter(n => n.completed).map(n => n.id)
    streakStore.recordPractice(completedIds, routineStore.totalDuration)
  }
})

function handleCompletedToggle() {
  animateToggle('success')
  if (activeNode.value && activeExercise.value) {
    routineStore.toggleExercise(activeNode.value.id, activeExercise.value.id)
  }
}

function createParticles(e: MouseEvent | { clientX: number, clientY: number }, emojis: string[]) {
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
  
  if (playerStore.isPlaying) {
    createParticles(e, ['🎼', '🎵', '🎶', '🎙️', '🎤'])
    if (ytPlayerInstance && ytPlayerInstance.playVideo) ytPlayerInstance.playVideo()
  } else {
    if (ytPlayerInstance && ytPlayerInstance.pauseVideo) ytPlayerInstance.pauseVideo()
  }
}

// Quando isPlaying muda via global (outro lugar), reflete no player se existir
watch(() => playerStore.isPlaying, (playing) => {
  if (ytPlayerInstance) {
    if (playing) ytPlayerInstance.playVideo?.()
    else ytPlayerInstance.pauseVideo?.()
  }
})

watch(() => playerStore.videoVolume, (vol) => {
  if (ytPlayerInstance && ytPlayerInstance.setVolume) {
    ytPlayerInstance.setVolume(vol)
  }
})

function extractVideoId(url: string) {
  if (url.includes('youtube.com/watch?v=')) {
    return url.split('v=')[1]?.split('&')[0]
  } else if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0]
  }
  return null
}

const currentVideoId = computed(() => {
  if (!currentVideo.value?.url) return null
  if ((currentVideo.value as any).type === 'reference') return null
  return extractVideoId(currentVideo.value.url)
})

function onPlayerReady(player: any) {
  ytPlayerInstance = player
  ytPlayerInstance.setVolume(playerStore.videoVolume)
  
  if (currentVideo.value && !currentVideo.value.duration && ytPlayerInstance.getDuration) {
    const duration = Math.round(ytPlayerInstance.getDuration() || 0)
    if (duration > 0 && activeNode.value && activeExercise.value) {
      // update specific video duration
      const vids = [...((activeExercise.value.media || activeExercise.value.videos) || [])]
      vids[playerStore.activeVideoIndex] = { ...vids[playerStore.activeVideoIndex]!, duration }
      routineStore.updateExercise(activeNode.value.id, activeExercise.value.id, activeExercise.value.media ? { media: vids as import('@/types').MediaItem[] } : { videos: vids as import('@/types').VideoMedia[] })
    }
  }

  if (playerStore.isPlaying) {
    ytPlayerInstance.playVideo()
  }
}

function onPlayerStateChange(state: number) {
  // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
  if (state === 1) {
    playerStore.isPlaying = true
  } else if (state === 2) {
    playerStore.isPlaying = false
  }
}

function onPlayerEnded() {
  playerStore.isPlaying = false
  
  // Se for o último vídeo do carrossel (ou único), marca como concluído se não estava
  const vids = activeExercise.value?.media || activeExercise.value?.videos || []
  if (playerStore.activeVideoIndex === vids.length - 1 || vids.length === 0) {
    if (activeNode.value && activeExercise.value && !activeExercise.value.completed) {
      routineStore.toggleExercise(activeNode.value.id, activeExercise.value.id, true)
    }
  }

  if (playerStore.autoAdvance) {
    setTimeout(() => {
      playerStore.next()
      playerStore.isPlaying = true // autoplay next
    }, 1500)
  }
}

function onPlayerNearEnd() {
  // Marca como concluído proximo do fim se for o último vídeo
  const vids = activeExercise.value?.media || activeExercise.value?.videos || []
  if (playerStore.activeVideoIndex === vids.length - 1 || vids.length === 0) {
    if (activeNode.value && activeExercise.value && !activeExercise.value.completed) {
      routineStore.toggleExercise(activeNode.value.id, activeExercise.value.id, true)
    }
  }
}

const editNode = computed(() => {
  if (!playerStore.editModeNodeId) return null
  return routineStore.nodes.find(n => n.id === playerStore.editModeNodeId)
})

function addMediaToExercise(ex: any) {
  if (!ex.media) ex.media = []
  ex.media.push({ id: `media-${Date.now()}`, type: 'video', url: '' })
  routineStore.saveToStorage()
}

function removeMediaFromExercise(ex: any, mIndex: number) {
  if (!ex.media) return
  ex.media.splice(mIndex, 1)
  routineStore.saveToStorage()
}


function exitEditMode() {
  if (editNode.value) {
    editNode.value.exercises.forEach(ex => {
      if (ex.media) {
        ex.media = ex.media.filter(m => m.url.trim() !== '')
      }
    })
    routineStore.saveToStorage()
  }
  playerStore.editModeNodeId = null
}

function confirmReset() {
  if (confirm('Tem certeza que deseja restaurar os exercícios desta seção para o padrão inicial? Isso apagará todas as edições.')) {
    routineStore.resetSectionToDefault(playerStore.editModeNodeId!)
  }
}

function handleGlobalKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
    return;
  }
  
  if (e.key === 'Escape') {
    if (playerStore.editModeNodeId) {
      exitEditMode();
    }
    return;
  }

  if (!shortcutsEnabled.value) return;

  if (e.ctrlKey || e.metaKey || e.altKey) return;

  switch (e.key.toLowerCase()) {
    case ' ':
      e.preventDefault();
      playerStore.togglePlay();
      break;
    case 'arrowleft':
      e.preventDefault();
      playerStore.prev();
      break;
    case 'arrowright':
      e.preventDefault();
      playerStore.next();
      break;
    case 'c':
      e.preventDefault();
      handleCompletedToggle();
      break;
    case 'h':
      e.preventDefault();
      if (!playerStore.editModeNodeId) {
        isHeaderExpanded.value = !isHeaderExpanded.value;
      }
      break;
    case 'e':
      e.preventDefault();
      if (!playerStore.editModeNodeId && activeNode.value) {
        playerStore.editModeNodeId = activeNode.value.id;
      }
      break;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<template>
  <div class="player-sidebar">

    <!-- Collapsible Header -->
    <div class="app-header-collapsible">
      <div class="collapsible-header" :class="{ 'no-pointer': playerStore.editModeNodeId }" @click="!playerStore.editModeNodeId && (isHeaderExpanded = !isHeaderExpanded)">
        <h2 class="app-title">
          <span v-if="authStore.user">Olá, {{ authStore.user.displayName?.split(' ')[0] || 'Cantor' }}</span>
          <span v-else>🎤 Trilha de Canto</span>
          <span v-if="hasNewTip && !isHeaderExpanded" class="new-tip-dot" title="Nova dica de IA disponível!">✨</span>
        </h2>
        <div class="header-actions" v-if="!playerStore.editModeNodeId">
          <span class="chevron">{{ isHeaderExpanded ? '▲' : '▼' }}</span>
        </div>
      </div>
      <Transition name="expand">
        <div class="collapsible-content" v-show="isHeaderExpanded && !playerStore.editModeNodeId">
          <div class="auth-section">
            <template v-if="authStore.user">
              <div class="auth-user-info">
                <img v-if="authStore.user.photoURL" :src="authStore.user.photoURL" class="auth-avatar" alt="Avatar" />
                <span class="auth-email">{{ authStore.user.email }}</span>
              </div>
              <button class="auth-btn" @click="authStore.logout()">Sair</button>
            </template>
            <template v-else>
              <div class="auth-msg-container">
                <span class="auth-icon">☁️</span>
                <span class="auth-msg">Faça login para sincronizar progresso.</span>
              </div>
              <button class="auth-btn login-btn" @click="authStore.login()">Logar com Google</button>
            </template>
          </div>
          <div class="side-actions">
            <DailyAdvice />
            <button class="toggle-side-btn" @click.stop="toggleSidebarPosition">⇋ Trocar Lado</button>
          </div>
          <StreakPanel />
          <div class="shortcuts-info">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h4 class="shortcuts-title" style="margin: 0;">Atalhos de Teclado</h4>
              <label class="auto-toggle" style="font-size: 0.8rem; gap: 6px;">
                <input type="checkbox" class="native-checkbox neutral-checkbox" style="width: 14px; height: 14px;" v-model="shortcutsEnabled" />
                <span>Ativos</span>
              </label>
            </div>
            <div class="shortcuts-list" :style="{ opacity: shortcutsEnabled ? 1 : 0.4, pointerEvents: shortcutsEnabled ? 'auto' : 'none', filter: shortcutsEnabled ? 'none' : 'grayscale(1)' }">
              <div class="shortcut-item"><kbd>Espaço</kbd> Play/Pause</div>
              <div class="shortcut-item"><kbd>←</kbd> Voltar</div>
              <div class="shortcut-item"><kbd>→</kbd> Avançar</div>
              <div class="shortcut-item"><kbd>C</kbd> Concluir</div>
              <div class="shortcut-item"><kbd>H</kbd> Header</div>
              <div class="shortcut-item"><kbd>E</kbd> Editar</div>
              <div class="shortcut-item"><kbd>Esc</kbd> Sair</div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- MODO DE EDIÇÃO -->
    <div v-if="playerStore.editModeNodeId" class="edit-mode-container">
      <div class="edit-header" v-if="editNode">
        <input class="edit-input section-title-input" v-model="editNode.title" placeholder="Título da Seção" @change="routineStore.saveToStorage()" />
        <div class="edit-actions">
          <button class="reset-btn" @click="confirmReset" title="Restaurar padrão da trilha">🔄</button>
          <button class="add-ex-btn" @click="routineStore.addExercise(playerStore.editModeNodeId!, 'Novo Exercício')">+ Novo</button>
          <button class="close-edit-btn" @click="exitEditMode">✖️ Sair</button>
        </div>
      </div>
      <div class="edit-list">
        <div v-for="ex in editNode?.exercises" :key="ex.id" class="edit-card">
          <input class="edit-input font-bold" v-model="ex.name" placeholder="Nome do exercício" @change="routineStore.saveToStorage()" />
          
          <div class="videos-edit-list">
            <div v-for="(m, mIdx) in ex.media" :key="m.id" class="video-edit-item">
              <select v-model="m.type" class="native-select small-select" @change="routineStore.saveToStorage()">
                <option value="video">Vídeo</option>
                <option value="reference">Referência</option>
              </select>
              <input class="edit-input url-input flex-1" v-model="m.title" placeholder="Título" @change="routineStore.saveToStorage()" />
              <input class="edit-input url-input flex-2" v-model="m.url" placeholder="URL" @change="routineStore.saveToStorage()" />
              <button class="delete-vid-btn" @click="removeMediaFromExercise(ex, mIdx)" title="Remover">✖</button>
            </div>
            <button class="add-vid-btn" @click="addMediaToExercise(ex)">+ Adicionar Mídia</button>
          </div>

          <div class="notes-edit-container">
            <label class="notes-label">Notas:</label>
            <RichTextEditor v-model="ex.notes" @update:modelValue="routineStore.saveToStorage()" />
          </div>
          
          <button class="delete-btn" @click="routineStore.removeExercise(playerStore.editModeNodeId!, ex.id)" title="Deletar">🗑️</button>
        </div>
      </div>
    </div>

    <!-- MODO PLAYER NORMAL -->
    <template v-else>
      <div class="sidebar-header">
        <div class="progress-section compact" :class="{ 'is-complete': progressPercent === 100 }">
          <div class="progress-header">
            <template v-if="progressPercent === 100">
              <span class="progress-text success-text bounce-anim">Sessão concluída 🚀</span>
            </template>
            <template v-else>
              <span class="progress-text">Progresso Geral</span>
              <span class="progress-stats">{{ completedCount }} / {{ routineStore.nodes.length }} seções</span>
            </template>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" :class="{ 'is-complete': progressPercent === 100 }" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>

        <hr class="header-divider" />

        <div class="active-info">
          <div class="active-info-top">
            <span class="active-time" >
              {{ activeNode?.title || 'Trilha' }}
              <span v-if="activeNode?.completed" class="floating-check">✅</span>
            </span>
            <label class="completion-checkbox custom-tooltip" :data-tooltip="activeExercise.completed ? 'Exercício concluído' : 'Marcar como concluído'" v-if="activeExercise">
              <input type="checkbox" class="native-checkbox green-checkbox" :checked="activeExercise.completed" @change="handleCompletedToggle" />
              
            </label>
          </div>
          <span class="active-title" >
            {{ activeExercise?.name || 'Selecione um exercício no mapa' }}
            <span v-if="(activeExercise?.media || activeExercise?.videos) && (activeExercise.media || activeExercise.videos)!.length > 1" class="video-counter-text">
              ({{ playerStore.activeVideoIndex + 1 }}/{{ (activeExercise.media || activeExercise.videos)!.length }})
            </span>
            <span v-if="activeExercise?.completed" class="floating-check">✅</span>
          </span>
        </div>
      </div>

      <!-- Media container -->
      <section class="media-container" :class="{ 'completed-media': activeExercise?.completed }">
        <template v-if="activeExercise">
          <YouTubePlayer
            v-if="currentVideoId"
            :key="currentVideoId"
            :videoId="currentVideoId"
            :autoplay="playerStore.isPlaying"
            @ready="onPlayerReady"
            @stateChange="onPlayerStateChange"
            @ended="onPlayerEnded"
            @nearEnd="onPlayerNearEnd"
          />
          <div v-else class="text-description with-content">
            <span class="tip-icon" v-if="!activeExercise.notes && (!currentVideo || (currentVideo as any).type !== 'reference')">💡</span>
            <h3 class="exercise-name-title">{{ activeExercise.name }}</h3>
            
            <div v-if="currentVideo && (currentVideo as any).type === 'reference'" class="reference-link">
              <a :href="currentVideo.url" target="_blank" class="native-button ref-btn">
                📄 {{ (currentVideo as any).title || 'Abrir Referência' }}
              </a>
            </div>

            <div v-if="activeExercise.notes" class="player-notes-view" v-html="activeExercise.notes"></div>
          </div>
        </template>
        <div v-else class="text-description empty">
          <p>Aguardando seleção...</p>
        </div>
        

      </section>

      <div class="sidebar-body">
        <div class="controls-card" :class="{ 'completed-card': activeExercise?.completed }">
          
          <!-- Volume Control -->
          <div class="volume-control" v-if="currentVideoId">
            <span class="vol-icon" @click="toggleMute" title="Mutar/Desmutar">{{ playerStore.videoVolume === 0 ? '🔇' : '🔉' }}</span>
            <input type="range" min="0" max="100" v-model.number="playerStore.videoVolume" class="vol-slider" />
          </div>

          <div class="player-controls">
            <button class="icon-btn" @click="(e) => { playerStore.prev(); createParticles(e, ['⏮️']) }" :disabled="playerStore.isFirstExercise && playerStore.activeVideoIndex === 0">⏮</button>
            <button
              class="icon-btn play-btn"
              :class="{ 'completed-play': activeExercise?.completed }"
              @click="handlePlayClick"
            >
              {{ playerStore.isPlaying ? '⏸' : '▶' }}
            </button>
            <button class="icon-btn" @click="(e) => { playerStore.next(); createParticles(e, ['⏭️']) }" :disabled="playerStore.isLastExercise && playerStore.activeVideoIndex === (((activeExercise?.media || activeExercise?.videos)?.length || 1) - 1)">⏭</button>
          </div>

          <label class="auto-toggle" :class="{ 'shake-anim': animatingToggle === 'auto' }">
              <input type="checkbox" class="native-checkbox neutral-checkbox" v-model="playerStore.autoAdvance" @change="animateToggle('auto')" />
              <span>Avançar automaticamente</span>
            </label>
        </div>


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
  overflow-y: scroll;
  overflow-x: hidden;
}

/* Minimalist Scrollbar */
.player-sidebar::-webkit-scrollbar {
  width: 6px;
}
.player-sidebar::-webkit-scrollbar-track {
  background: transparent;
}
.player-sidebar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.player-sidebar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
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
  max-height: 1000px;
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.shortcuts-info {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  padding: 12px;
  border-radius: 8px;
}

.shortcuts-title {
  font-size: 0.85rem;
  color: #475569;
  margin: 0 0 8px 0;
  text-transform: uppercase;
}

.shortcuts-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.shortcut-item {
  font-size: 0.75rem;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 6px;
}

kbd {
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-weight: bold;
  color: #0f172a;
}

.edit-mode-container {
  padding: 20px;
  background: #f8fafc;
  flex: 1;
  overflow-y: auto;
}


.section-title-input {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  padding: 6px 12px;
  border: 1px dashed #cbd5e1;
  background: transparent;
  flex: 1;
  margin-right: 12px;
}

.section-title-input:focus {
  background: #ffffff;
  border-color: #3b82f6;
  outline: none;
}

.reset-btn {
  background: #e2e8f0;
  border: none;
  font-size: 1.1rem;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.reset-btn:hover {
  background: #cbd5e1;
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

.videos-edit-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #cbd5e1;
}

.video-edit-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.delete-vid-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 1rem;
}

.add-vid-btn {
  background: #e2e8f0;
  border: none;
  padding: 6px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: bold;
  color: #334155;
  align-self: flex-start;
  margin-top: 4px;
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

.new-tip-dot {
  font-size: 1.2rem;
  animation: pulse-dot 1.5s infinite;
  display: inline-block;
  margin-left: 8px;
}

@keyframes pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
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
  gap: 20px;
  flex-direction: column;
  align-items: stretch;
}

.auth-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
  gap: 12px;
}

.auth-user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.auth-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
}

.auth-email {
  font-size: 0.85rem;
  color: #475569;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.auth-msg-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.auth-msg {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.auth-btn {
  background: #e2e8f0;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.auth-btn:hover {
  background: #cbd5e1;
}

.login-btn {
  background: #3b82f6;
  color: #ffffff;
}

.login-btn:hover {
  background: #2563eb;
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

.active-info-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.completion-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
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
  aspect-ratio: 16 / 9; /* Espaço reservado */
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-bottom: 4px solid #ffe500;
  transition: border-color 0.3s;
  position: relative;
}

.completed-media {
  border-bottom-color: #22c55e;
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

.video-counter-text {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 700;
  margin-left: 6px;
}

.custom-tooltip {
  position: relative;
}

.custom-tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 120%;
  right: 0;
  background: #0f172a;
  color: #f8fafc;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transform: translateY(5px);
  transition: all 0.2s ease;
  z-index: 100;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.custom-tooltip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  right: 6px;
  border-width: 5px;
  border-style: solid;
  border-color: #0f172a transparent transparent transparent;
  opacity: 0;
  pointer-events: none;
  transform: translateY(5px);
  transition: all 0.2s ease;
  z-index: 100;
}

.custom-tooltip:hover::after,
.custom-tooltip:hover::before {
  opacity: 1;
  transform: translateY(0);
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
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.completed-card {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.vol-icon {
  font-size: 1.2rem;
}

.vol-slider {
  flex: 1;
  accent-color: #94a3b8;
}

.vol-icon {
  font-size: 1.2rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.vol-icon:hover {
  transform: scale(1.1);
}

.player-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
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


.auto-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
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


.success-text {
  color: #22c55e !important;
  font-size: 1rem !important;
  text-align: center;
  width: 100%;
}

.bounce-anim {
  animation: bounceText 1s infinite;
}

@keyframes bounceText {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.progress-bar-fill.is-complete {
  background: linear-gradient(90deg, #22c55e, #16a34a);
  animation: pulseBar 1.5s infinite;
}

@keyframes pulseBar {
  0% { opacity: 1; }
  50% { opacity: 0.7; box-shadow: 0 0 10px #22c55e; }
  100% { opacity: 1; }
}

.progress-section.is-complete {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
  animation: sectionGlow 2s infinite;
}

@keyframes sectionGlow {
  0%, 100% { box-shadow: 0 0 5px rgba(34, 197, 94, 0.1); }
  50% { box-shadow: 0 0 15px rgba(34, 197, 94, 0.3); }
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



.player-notes-view :deep(ul) { list-style-type: disc; padding-left: 20px; margin: 0 0 0.5em 0; }
.player-notes-view :deep(ol) { list-style-type: decimal; padding-left: 20px; margin: 0 0 0.5em 0; }
.player-notes-view :deep(li) { margin-bottom: 0.2em; }
.player-notes-view :deep(h1) { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; }
.player-notes-view :deep(h2) { font-size: 1.3em; font-weight: bold; margin: 0.5em 0; }
.player-notes-view :deep(h3) { font-size: 1.1em; font-weight: bold; margin: 0.5em 0; }
.player-notes-view :deep(strong) { font-weight: 800; }
</style>

<style scoped>
.font-bold { font-weight: bold; }
.native-select.small-select {
  padding: 6px;
  font-size: 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}
.flex-1 { flex: 1; min-width: 0; }
.flex-2 { flex: 2; min-width: 0; }
.notes-edit-container {
  margin-top: 12px;
}
.notes-label {
  display: block;
  font-size: 0.85rem;
  font-weight: bold;
  color: #475569;
  margin-bottom: 4px;
}
</style>

<style scoped>
.with-content {
  justify-content: flex-start;
  overflow-y: auto;
  align-items: flex-start;
  text-align: left;
}
.exercise-name-title {
  font-size: 1.2rem;
  margin-bottom: 16px;
  text-align: center;
  width: 100%;
}
.reference-link {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}
.ref-btn {
  text-decoration: none;
  display: inline-block;
}
.player-notes-view {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  padding: 16px;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.5;
}
.player-notes-view :deep(p) {
  margin-bottom: 0.5em;
}
.player-notes-view :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
