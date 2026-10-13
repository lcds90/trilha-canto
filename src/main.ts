import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { initPwa } from './composables/usePwa'

// Inicializa o PWA o quanto antes para capturar o evento `beforeinstallprompt`
initPwa()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
