import { ref, computed } from 'vue'
import { registerSW } from 'virtual:pwa-register'

/**
 * Composable de PWA (singleton de módulo):
 * - Registra o service worker (gerado pelo vite-plugin-pwa)
 * - Captura o evento `beforeinstallprompt` para exibir um botão "Instalar app"
 * - Detecta iOS (sem prompt nativo) para exibir instruções manuais
 * - Expõe aviso de nova versão disponível / pronto para uso offline
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const isInstalled = ref(false)
const needRefresh = ref(false)
const offlineReady = ref(false)
let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null
let initialized = false

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: window-controls-overlay)').matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

const isIOS =
  typeof navigator !== 'undefined' &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS se identifica como Mac com touch
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

export function initPwa() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  isInstalled.value = detectStandalone()

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e as BeforeInstallPromptEvent
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
    isInstalled.value = true
  })

  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', (ev) => {
    isInstalled.value = ev.matches || detectStandalone()
  })

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        needRefresh.value = true
      },
      onOfflineReady() {
        offlineReady.value = true
        setTimeout(() => (offlineReady.value = false), 4000)
      },
      onRegisteredSW(_url, registration) {
        // Verifica atualizações a cada hora enquanto o app estiver aberto
        if (registration) {
          setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000)
        }
      },
    })
  }
}

export function usePwa() {
  const canInstall = computed(() => !!deferredPrompt.value && !isInstalled.value)
  const showIOSHint = computed(() => isIOS && !isInstalled.value)

  async function promptInstall(): Promise<boolean> {
    const evt = deferredPrompt.value
    if (!evt) return false
    await evt.prompt()
    const { outcome } = await evt.userChoice
    deferredPrompt.value = null
    return outcome === 'accepted'
  }

  async function applyUpdate() {
    needRefresh.value = false
    if (updateSW) await updateSW(true)
    else window.location.reload()
  }

  function dismissUpdate() {
    needRefresh.value = false
  }

  return {
    canInstall,
    showIOSHint,
    isInstalled,
    needRefresh,
    offlineReady,
    promptInstall,
    applyUpdate,
    dismissUpdate,
  }
}
