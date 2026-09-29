<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  videoId: string
  autoplay?: boolean
}>()

const emit = defineEmits<{
  (e: 'ready', player: any): void
  (e: 'stateChange', state: number): void
  (e: 'ended'): void
  (e: 'nearEnd'): void
}>()

const playerContainer = ref<HTMLElement | null>(null)
let player: any = null
let timeCheckInterval: any = null

function loadYouTubeAPI() {
  return new Promise<void>((resolve) => {
    if ((window as any).YT && (window as any).YT.Player) {
      resolve()
      return
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)

    ;(window as any).onYouTubeIframeAPIReady = () => {
      resolve()
    }
  })
}

function initPlayer() {
  if (!playerContainer.value) return

  if (player) {
    player.destroy()
  }

  player = new (window as any).YT.Player(playerContainer.value, {
    videoId: props.videoId,
    playerVars: {
      autoplay: props.autoplay ? 1 : 0,
      rel: 0,
      modestbranding: 1,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    }
  })
}

function onPlayerReady(event: any) {
  emit('ready', player)
  if (props.autoplay) {
    player.playVideo()
  }
}

function onPlayerStateChange(event: any) {
  emit('stateChange', event.data)
  
  if (event.data === (window as any).YT.PlayerState.PLAYING) {
    startTimeCheck()
  } else {
    stopTimeCheck()
  }

  if (event.data === (window as any).YT.PlayerState.ENDED) {
    emit('ended')
  }
}

function startTimeCheck() {
  stopTimeCheck()
  timeCheckInterval = setInterval(() => {
    if (player && player.getCurrentTime && player.getDuration) {
      const current = player.getCurrentTime()
      const total = player.getDuration()
      if (total > 0 && total - current <= 2) {
        emit('nearEnd')
      }
    }
  }, 1000)
}

function stopTimeCheck() {
  if (timeCheckInterval) {
    clearInterval(timeCheckInterval)
    timeCheckInterval = null
  }
}

watch(() => props.videoId, () => {
  if (player && player.loadVideoById) {
    player.loadVideoById(props.videoId)
  } else {
    initPlayer()
  }
})

onMounted(async () => {
  await loadYouTubeAPI()
  initPlayer()
})

onUnmounted(() => {
  stopTimeCheck()
  if (player) {
    player.destroy()
  }
})
</script>

<template>
  <div class="youtube-wrapper">
    <div ref="playerContainer"></div>
  </div>
</template>

<style scoped>
.youtube-wrapper {
  width: 100%;
  height: 100%;
  display: block;
}
.youtube-wrapper :deep(iframe) {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>
