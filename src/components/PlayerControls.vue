<script setup lang="ts">
import { computed, inject, ref, watch, onMounted, onUnmounted, type Ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useRoutineStore } from '@/stores/routine'
import { useStreakStore } from '@/stores/streak'
import { useAuthStore } from '@/stores/auth'
import { useMetronomeStore } from '@/stores/metronome'
import { useVoiceCoach } from '@/composables/useVoiceCoach'
import { usePwa } from '@/composables/usePwa'
import StreakPanel from '@/components/StreakPanel.vue'
import YouTubePlayer from '@/components/YouTubePlayer.vue'
import DailyAdvice from '@/components/DailyAdvice.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import MetronomeWidget from '@/components/MetronomeWidget.vue'
import gsap from 'gsap'

const playerStore = usePlayerStore()
const routineStore = useRoutineStore()
const streakStore = useStreakStore()
const authStore = useAuthStore()
const metronomeStore = useMetronomeStore()
const voiceCoach = useVoiceCoach()

const toggleSidebarPosition = inject('toggleSidebarPosition') as () => void
const isMobile = inject<Ref<boolean>>('isMobile', ref(false))
const sheetState = inject<Ref<'half' | 'full'>>('sheetState', ref('half'))
// No celular o cabeçalho começa recolhido para priorizar o player
const isHeaderExpanded = ref(!isMobile.value)
const hasNewTip = ref(true)
watch(isHeaderExpanded, (val) => {
  if (val) hasNewTip.value = false
})

// Ao entrar no modo de edição no celular, expande o bottom sheet
watch(() => playerStore.editModeNodeId, (id) => {
  if (id && isMobile.value) sheetState.value = 'full'
})

// ============ PWA: instalação ============
const { canInstall, showIOSHint, isInstalled, promptInstall } = usePwa()
const showIOSInstructions = ref(false)
async function handleInstallClick() {
  if (canInstall.value) {
    await promptInstall()
  } else if (showIOSHint.value) {
    showIOSInstructions.value = !showIOSInstructions.value
    isHeaderExpanded.value = true
  }
}

const shortcutsEnabled = ref(localStorage.getItem('trilha-canto-shortcuts') !== 'false')
watch(shortcutsEnabled, (val) => {
  localStorage.setItem('trilha-canto-shortcuts', val.toString())
})

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

function createParticles(e: MouseEvent | { clientX: number, clientY: number }, emojis: string[]) {
  if (!e || typeof (e as any).clientX !== 'number') return
  for (let i = 0; i < 4; i++) {
    const el = document.createElement('div')
    el.innerText = emojis[Math.floor(Math.random() * emojis.length)]!
    el.style.position = 'fixed'
    el.style.left = (e as MouseEvent).clientX + 'px'
    el.style.top = (e as MouseEvent).clientY + 'px'
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

// ============ TOGGLE DE CONCLUSÃO DO EXERCÍCIO ============
function handleCompletedToggle(e?: MouseEvent) {
  if (activeNode.value && activeExercise.value) {
    const willBeCompleted = !activeExercise.value.completed
    routineStore.toggleExercise(activeNode.value.id, activeExercise.value.id)

    if (willBeCompleted && e) {
      createParticles(e, ['✅', '🌟', '👏', '✨'])
    }

    if (willBeCompleted && playerStore.autoAdvance) {
      setTimeout(() => {
        playerStore.next()
      }, 1200)
    }
  }
}

// ============ FINALIZAÇÃO VIA TEMPORIZADOR ============
function handleTimerFinished() {
  if (activeNode.value && activeExercise.value) {
    routineStore.toggleExercise(activeNode.value.id, activeExercise.value.id, true)
  }
  setTimeout(() => {
    playerStore.next()
  }, 1000)
}

function handlePlayClick(e: MouseEvent) {
  playerStore.togglePlay()
  
  if (playerStore.isPlaying) {
    voiceCoach.speak('Iniciando')
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
  
  // Fala "Finalizado" ao término do vídeo
  voiceCoach.speak('Finalizado')

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

// ============ REORDERING & DRAG-AND-DROP ============
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const dropPosition = ref<'top' | 'bottom' | null>(null)

function moveExercise(fromIdx: number, toIdx: number) {
  if (!editNode.value || fromIdx === toIdx) return
  if (toIdx < 0 || toIdx >= editNode.value.exercises.length) return

  const currentActiveExId = activeExercise.value?.id
  const nodeId = editNode.value.id

  routineStore.reorderExercises(nodeId, fromIdx, toIdx)

  if (activeNode.value?.id === nodeId && currentActiveExId) {
    const newIdx = editNode.value.exercises.findIndex(e => e.id === currentActiveExId)
    if (newIdx !== -1) {
      playerStore.activeExerciseIndex = newIdx
    }
  }
}

function moveExerciseUp(index: number) {
  moveExercise(index, index - 1)
}

function moveExerciseDown(index: number) {
  moveExercise(index, index + 1)
}

function handleDragStart(index: number, event: DragEvent) {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', index.toString())
  }
}

function handleDragOver(index: number, event: DragEvent) {
  if (draggedIndex.value === null || draggedIndex.value === index) {
    dragOverIndex.value = null
    dropPosition.value = null
    return
  }
  const target = (event.currentTarget as HTMLElement)
  const rect = target.getBoundingClientRect()
  const midY = rect.top + rect.height / 2
  dragOverIndex.value = index
  dropPosition.value = event.clientY < midY ? 'top' : 'bottom'
}

function handleDragLeave(index: number) {
  if (dragOverIndex.value === index) {
    dragOverIndex.value = null
    dropPosition.value = null
  }
}

function handleDrop(targetIndex: number) {
  if (draggedIndex.value === null || !editNode.value) return
  const fromIdx = draggedIndex.value
  const toIdx = Math.max(0, Math.min(editNode.value.exercises.length - 1, targetIndex))

  moveExercise(fromIdx, toIdx)
  handleDragEnd()
}

function handleDragEnd() {
  draggedIndex.value = null
  dragOverIndex.value = null
  dropPosition.value = null
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
    case 'm':
      e.preventDefault();
      metronomeStore.toggle();
      break;
    case 't':
      e.preventDefault();
      metronomeStore.toggleTimer();
      break;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
  metronomeStore.onTimerFinish(handleTimerFinished);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  metronomeStore.removeTimerFinishListener(handleTimerFinished);
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
          <button
            v-if="canInstall || showIOSHint"
            type="button"
            class="install-chip"
            @click.stop="handleInstallClick"
            title="Instalar o app neste dispositivo"
          >📲 Instalar</button>
          <span class="chevron">{{ isHeaderExpanded ? '▲' : '▼' }}</span>
        </div>
      </div>
      <Transition name="expand">
        <div class="collapsible-content" v-show="isHeaderExpanded && !playerStore.editModeNodeId">
          <!-- Instalação do app (PWA) -->
          <div v-if="(canInstall || showIOSHint) && !isInstalled" class="install-card">
            <div class="install-card-text">
              <span class="install-card-icon">📲</span>
              <div>
                <strong>Instale a Trilha de Canto</strong>
                <span class="install-card-sub">Acesse direto da tela inicial, em tela cheia e até offline.</span>
              </div>
            </div>
            <button v-if="canInstall" type="button" class="install-btn" @click.stop="promptInstall">Instalar app</button>
            <button v-else type="button" class="install-btn" @click.stop="showIOSInstructions = !showIOSInstructions">Como instalar</button>
            <ol v-if="showIOSHint && showIOSInstructions" class="ios-steps">
              <li>Toque em <strong>Compartilhar</strong> <span aria-hidden="true">⬆️</span> na barra do Safari</li>
              <li>Escolha <strong>Adicionar à Tela de Início</strong> <span aria-hidden="true">➕</span></li>
              <li>Confirme em <strong>Adicionar</strong></li>
            </ol>
          </div>
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
            <button v-if="!isMobile" class="toggle-side-btn" @click.stop="toggleSidebarPosition">⇋ Trocar Lado</button>
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
              <div class="shortcut-item"><kbd>M</kbd> Metrônomo</div>
              <div class="shortcut-item"><kbd>T</kbd> Timer</div>
              <div class="shortcut-item"><kbd>H</kbd> Header</div>
              <div class="shortcut-item"><kbd>E</kbd> Editar</div>
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
        <div
          v-for="(ex, index) in editNode?.exercises"
          :key="ex.id"
          class="edit-card"
          :class="{
            'is-dragging': draggedIndex === index,
            'drop-target-top': dragOverIndex === index && dropPosition === 'top',
            'drop-target-bottom': dragOverIndex === index && dropPosition === 'bottom'
          }"
          @dragover.prevent="handleDragOver(index, $event)"
          @dragleave="handleDragLeave(index)"
          @drop="handleDrop(index)"
        >
          <div class="edit-card-header">
            <div class="card-reorder-group">
              <span
                class="drag-handle"
                title="Arraste para reordenar"
                draggable="true"
                @dragstart="handleDragStart(index, $event)"
                @dragend="handleDragEnd"
              >⋮⋮</span>
              <span class="order-badge">#{{ index + 1 }}</span>
              <div class="reorder-buttons">
                <button
                  type="button"
                  class="reorder-btn"
                  :disabled="index === 0"
                  @click="moveExerciseUp(index)"
                  title="Mover para cima"
                >▲</button>
                <button
                  type="button"
                  class="reorder-btn"
                  :disabled="index === ((editNode?.exercises.length || 1) - 1)"
                  @click="moveExerciseDown(index)"
                  title="Mover para baixo"
                >▼</button>
              </div>
            </div>
            
            <button
              type="button"
              class="card-delete-btn"
              @click="routineStore.removeExercise(playerStore.editModeNodeId!, ex.id)"
              title="Deletar exercício"
            >🗑️</button>
          </div>

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
        </div>
      </div>
    </div>

    <!-- MODO PLAYER NORMAL -->
    <template v-else>
      <!-- Cabeçalho Minimalista da Seção e Progresso -->
      <div class="sidebar-header">
        <div class="minimal-progress-row">
          <div class="progress-info-left">
            <span class="section-badge">{{ activeNode?.title || 'Trilha de Canto' }}</span>
          </div>
          <span class="progress-stats-text">
            {{ completedCount }}/{{ routineStore.nodes.length }} seções
          </span>
        </div>

        <div class="slim-progress-track">
          <div
            class="slim-progress-fill"
            :class="{ 'is-complete': progressPercent === 100 }"
            :style="{ width: progressPercent + '%' }"
          ></div>
        </div>

        <div class="exercise-headline">
          <span class="active-exercise-title">
            {{ activeExercise?.name || 'Selecione um exercício' }}
          </span>
          <span
            v-if="(activeExercise?.media || activeExercise?.videos) && (activeExercise.media || activeExercise.videos)!.length > 1"
            class="media-counter-tag"
          >
            Mídia {{ playerStore.activeVideoIndex + 1 }}/{{ (activeExercise.media || activeExercise.videos)!.length }}
          </span>
        </div>
      </div>

      <!-- Área de Mídia (Vídeo 16:9 ou Notas/Referência) -->
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

      <!-- Corpo da Sidebar -->
      <div class="sidebar-body">
        <!-- 1. METRÔNOMO E TEMPORIZADOR LADO A LADO (ACIMA DO PLAYER) -->
        <MetronomeWidget />

        <!-- 2. PLAYER MINIMALISTA (COM CHECKBOX JUNTO DE AVANÇAR E VOLTAR) -->
        <div class="minimal-player-card" :class="{ 'is-completed': activeExercise?.completed }">
          <!-- Linha Principal: Voltar, Play/Pause, Avançar, e Checkbox Concluir -->
          <div class="playback-main-row">
            <button
              type="button"
              class="nav-btn prev-btn"
              @click="(e) => { playerStore.prev(); createParticles(e, ['⏮️']) }"
              :disabled="playerStore.isFirstExercise && playerStore.activeVideoIndex === 0"
              title="Exercício anterior (←)"
            >
              ⏮
            </button>

            <button
              type="button"
              class="primary-play-btn"
              :class="{
                'is-playing': playerStore.isPlaying,
                'is-completed': activeExercise?.completed
              }"
              @click="handlePlayClick"
              :title="playerStore.isPlaying ? 'Pausar (Espaço)' : 'Reproduzir (Espaço)'"
            >
              {{ playerStore.isPlaying ? '⏸' : '▶' }}
            </button>

            <button
              type="button"
              class="nav-btn next-btn"
              @click="(e) => { playerStore.next(); createParticles(e, ['⏭️']) }"
              :disabled="playerStore.isLastExercise && playerStore.activeVideoIndex === (((activeExercise?.media || activeExercise?.videos)?.length || 1) - 1)"
              title="Próximo exercício (→)"
            >
              ⏭
            </button>

            <!-- Checkbox de completar aula junto dos players de avançar e voltar -->
            <button
              type="button"
              class="complete-toggle-pill"
              :class="{ 'is-completed': activeExercise?.completed }"
              @click="handleCompletedToggle"
              :title="activeExercise?.completed ? 'Exercício concluído! Clique para desmarcar (C)' : 'Marcar exercício como concluído (C)'"
            >
              <span class="pill-check-box">
                <svg v-if="activeExercise?.completed" viewBox="0 0 24 24" class="pill-check-svg">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
              <span class="pill-label">
                {{ activeExercise?.completed ? 'Concluído' : 'Concluir' }}
              </span>
            </button>
          </div>

          <!-- Linha Secundária: Volume, Auto-avançar e Controle de Voz -->
          <div class="playback-sub-row">
            <!-- Volume do vídeo -->
            <div class="minimal-volume-group" v-if="currentVideoId">
              <span class="minimal-vol-icon" @click="toggleMute" title="Mutar/Desmutar">
                {{ playerStore.videoVolume === 0 ? '🔇' : '🔉' }}
              </span>
              <input
                type="range"
                min="0"
                max="100"
                v-model.number="playerStore.videoVolume"
                class="minimal-vol-slider"
              />
            </div>

            <div class="sub-actions-right">
              <!-- Auto-avançar -->
              <label class="auto-advance-label" title="Avançar automaticamente para o próximo exercício ao concluir">
                <input
                  type="checkbox"
                  class="minimal-checkbox"
                  v-model="playerStore.autoAdvance"
                />
                <span>Auto-avançar</span>
              </label>

              <!-- Voz sintetizada ("Iniciando" e "Finalizado") -->
              <button
                type="button"
                class="voice-coach-chip"
                :class="{ 'is-active': voiceCoach.isVoiceEnabled.value }"
                @click="voiceCoach.toggleVoice()"
                :title="voiceCoach.isVoiceEnabled.value ? 'Voz ativada (fala Iniciando e Finalizado)' : 'Voz desativada (silencioso)'"
              >
                <span>{{ voiceCoach.isVoiceEnabled.value ? '🎙️ Voz On' : '🔇 Voz Off' }}</span>
              </button>
            </div>
          </div>
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
  flex: 1;
  min-height: 0;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* Minimalist Scrollbar */
.player-sidebar::-webkit-scrollbar {
  width: 5px;
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

/* Header colapsável minimalista */
.app-header-collapsible {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.collapsible-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  background: #ffffff;
  transition: background 0.2s ease;
}

.collapsible-header:hover {
  background: #f8fafc;
}

.no-pointer {
  cursor: default !important;
}

.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
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
  gap: 8px;
}

.app-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.3px;
  margin: 0;
  display: flex;
  align-items: center;
}

.new-tip-dot {
  font-size: 1.1rem;
  animation: pulse-dot 1.5s infinite;
  display: inline-block;
  margin-left: 6px;
}

@keyframes pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
}

.chevron {
  font-size: 0.75rem;
  color: #64748b;
}

.collapsible-content {
  padding: 14px 16px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  display: flex;
  gap: 14px;
  flex-direction: column;
}

/* ============ Sidebar Header & Progresso Minimalista ============ */
.sidebar-header {
  padding: 14px 16px 12px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.minimal-progress-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.section-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress-stats-text {
  font-weight: 700;
  color: #0f172a;
}

.slim-progress-track {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.slim-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffe500, #22c55e);
  transition: width 0.4s ease;
}

.slim-progress-fill.is-complete {
  background: #22c55e;
}

.exercise-headline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
}

.active-exercise-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
  letter-spacing: -0.2px;
}

.media-counter-tag {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

/* ============ Mídia (Vídeo e Notas) ============ */
.media-container {
  background: #0f172a;
  width: 100%;
  aspect-ratio: 16 / 9;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-bottom: 2px solid #e2e8f0;
  transition: border-color 0.3s;
  position: relative;
}

.completed-media {
  border-bottom-color: #22c55e;
}

.text-description {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.95rem;
  height: 100%;
}

.text-description.empty {
  opacity: 0.5;
}

.tip-icon {
  font-size: 1.8rem;
}

.with-content {
  justify-content: flex-start;
  overflow-y: auto;
  align-items: flex-start;
  text-align: left;
}

.exercise-name-title {
  font-size: 1.1rem;
  margin-bottom: 12px;
  text-align: center;
  width: 100%;
}

.reference-link {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.ref-btn {
  text-decoration: none;
  display: inline-block;
  background: #3b82f6;
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.85rem;
}

.player-notes-view {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.5;
}

.player-notes-view :deep(p) {
  margin-bottom: 0.5em;
}
.player-notes-view :deep(p:last-child) {
  margin-bottom: 0;
}
.player-notes-view :deep(ul) { list-style-type: disc; padding-left: 20px; margin: 0 0 0.5em 0; }
.player-notes-view :deep(ol) { list-style-type: decimal; padding-left: 20px; margin: 0 0 0.5em 0; }
.player-notes-view :deep(li) { margin-bottom: 0.2em; }
.player-notes-view :deep(h1) { font-size: 1.4em; font-weight: bold; margin: 0.5em 0; }
.player-notes-view :deep(h2) { font-size: 1.2em; font-weight: bold; margin: 0.5em 0; }
.player-notes-view :deep(h3) { font-size: 1.05em; font-weight: bold; margin: 0.5em 0; }
.player-notes-view :deep(strong) { font-weight: 800; }

/* ============ Sidebar Body ============ */
.sidebar-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

/* ============ Minimalist Player Card ============ */
.minimal-player-card {
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

.minimal-player-card.is-completed {
  border-color: #22c55e;
  background: #fcfdfd;
}

/* Linha principal com Prev, Play, Next e Checkbox juntos */
.playback-main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.nav-btn {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #334155;
  border-radius: 8px;
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1;
}

.nav-btn:hover:not(:disabled) {
  background: #e2e8f0;
  color: #0f172a;
  transform: translateY(-1px);
}

.nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.primary-play-btn {
  background: #ffe500;
  color: #000;
  border: 1px solid #d4b300;
  border-radius: 10px;
  width: 50px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 4px rgba(212, 179, 0, 0.3);
}

.primary-play-btn:hover {
  background: #ffea2e;
  transform: translateY(-1px);
}

.primary-play-btn.is-completed {
  background: #22c55e;
  border-color: #16a34a;
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
}

/* CHECKBOX DE COMPLETAR AULA: JUNTO COM OS PLAYERS DE AVANÇAR E VOLTAR */
.complete-toggle-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 12px;
  height: 38px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.complete-toggle-pill:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.pill-check-box {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid #94a3b8;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.pill-check-svg {
  width: 13px;
  height: 13px;
  stroke: #ffffff;
  stroke-width: 3;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.pill-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
  transition: color 0.2s;
}

.complete-toggle-pill.is-completed {
  background: #f0fdf4;
  border-color: #22c55e;
}

.complete-toggle-pill.is-completed .pill-check-box {
  background: #22c55e;
  border-color: #22c55e;
}

.complete-toggle-pill.is-completed .pill-label {
  color: #16a34a;
}

/* Linha secundária de controles */
.playback-sub-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 6px;
  border-top: 1px dashed #e2e8f0;
}

.minimal-volume-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  max-width: 140px;
}

.minimal-vol-icon {
  font-size: 0.95rem;
  cursor: pointer;
  user-select: none;
}

.minimal-vol-slider {
  width: 100%;
  height: 4px;
  accent-color: #475569;
  cursor: pointer;
}

.sub-actions-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.auto-advance-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  user-select: none;
}

.minimal-checkbox {
  width: 13px;
  height: 13px;
  accent-color: #0f172a;
  cursor: pointer;
}

.voice-coach-chip {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.voice-coach-chip:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.voice-coach-chip.is-active {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #2563eb;
}

/* ============ Outras Seções (Auth, Streak, Edit Mode, etc) ============ */
.auth-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
  gap: 10px;
}

.auth-user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.auth-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
}

.auth-email {
  font-size: 0.8rem;
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
  gap: 6px;
}

.auth-msg {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.auth-btn {
  background: #e2e8f0;
  border: none;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
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

.side-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-side-btn {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 8px;
  color: #334155;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-side-btn:hover {
  background: #ffffff;
  color: #0f172a;
  border-color: #94a3b8;
}

.shortcuts-info {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  padding: 10px;
  border-radius: 8px;
}

.shortcuts-title {
  font-size: 0.8rem;
  color: #475569;
  margin: 0 0 6px 0;
  text-transform: uppercase;
}

.shortcuts-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.shortcut-item {
  font-size: 0.72rem;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 5px;
}

kbd {
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 1px 5px;
  font-family: monospace;
  font-weight: bold;
  color: #0f172a;
}

.native-checkbox {
  accent-color: #475569;
}

/* Edit Mode */
.edit-mode-container {
  padding: 16px;
  background: #f8fafc;
  flex: 1;
  overflow-y: auto;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title-input {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  padding: 6px 10px;
  border: 1px dashed #cbd5e1;
  background: transparent;
  flex: 1;
  margin-right: 8px;
  border-radius: 4px;
}

.section-title-input:focus {
  background: #ffffff;
  border-color: #3b82f6;
  outline: none;
}

.edit-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.reset-btn {
  background: #e2e8f0;
  border: none;
  font-size: 1rem;
  padding: 5px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.add-ex-btn {
  background: #22c55e;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.8rem;
}

.close-edit-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 5px 10px;
  font-weight: bold;
  font-size: 0.8rem;
  cursor: pointer;
}

.edit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-card {
  background: white;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.15s ease;
}

.edit-card.is-dragging {
  opacity: 0.4;
  border: 2px dashed #3b82f6;
  background: #f8fafc;
}

.edit-card.drop-target-top {
  border-top: 3px solid #3b82f6;
}

.edit-card.drop-target-bottom {
  border-bottom: 3px solid #3b82f6;
}

.edit-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-reorder-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.drag-handle {
  cursor: grab;
  color: #94a3b8;
  padding: 2px 4px;
}

.order-badge {
  font-size: 0.72rem;
  font-weight: 800;
  color: #475569;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2px 5px;
}

.reorder-buttons {
  display: flex;
  gap: 3px;
}

.reorder-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.65rem;
  cursor: pointer;
}

.reorder-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.card-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.6;
}

.card-delete-btn:hover {
  opacity: 1;
}

.edit-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.9rem;
}

.font-bold {
  font-weight: bold;
}

.videos-edit-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #cbd5e1;
}

.video-edit-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.native-select.small-select {
  padding: 5px;
  font-size: 0.78rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.url-input {
  font-family: monospace;
  font-size: 0.8rem;
}

.delete-vid-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
}

.add-vid-btn {
  background: #e2e8f0;
  border: none;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  font-weight: bold;
  color: #334155;
  align-self: flex-start;
}

.notes-edit-container {
  margin-top: 8px;
}

.notes-label {
  display: block;
  font-size: 0.8rem;
  font-weight: bold;
  color: #475569;
  margin-bottom: 4px;
}

.flex-1 { flex: 1; min-width: 0; }
.flex-2 { flex: 2; min-width: 0; }

/* ============ PWA: botão e card de instalação ============ */
.install-chip {
  background: #0f172a;
  color: #ffe500;
  border: 1px solid #0f172a;
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
}

.install-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #0f172a;
  color: #f8fafc;
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 229, 0, 0.35);
}

.install-card-text {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.8rem;
  line-height: 1.3;
}

.install-card-text strong {
  display: block;
  color: #ffe500;
}

.install-card-icon {
  font-size: 1.3rem;
  line-height: 1;
}

.install-card-sub {
  display: block;
  color: #cbd5e1;
  font-size: 0.72rem;
}

.install-btn {
  align-self: flex-start;
  background: #ffe500;
  color: #000;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-weight: 800;
  font-size: 0.8rem;
  cursor: pointer;
}

.ios-steps {
  margin: 0;
  padding-left: 18px;
  font-size: 0.75rem;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* ============ Dispositivos de toque ============ */
@media (hover: none) and (pointer: coarse) {
  .shortcuts-info {
    display: none;
  }
  .drag-handle {
    display: none;
  }
}

/* ============ Mobile ============ */
@media (max-width: 768px) {
  .collapsible-header {
    padding: 10px 14px;
  }
  .sidebar-header {
    padding: 10px 14px;
  }
  .sidebar-body {
    padding: 12px 14px 20px;
  }
  .nav-btn {
    width: 44px;
    height: 44px;
  }
  .primary-play-btn {
    width: 56px;
    height: 44px;
  }
  .complete-toggle-pill {
    height: 44px;
  }
  .edit-mode-container {
    padding: 10px;
  }
}
</style>
