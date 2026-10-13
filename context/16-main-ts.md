# Contexto 16 — main.ts (Entry Point)

> Atualize `src/main.ts` para configurar Componentes Nativos e ToastService.

## Arquivo: `src/main.ts`

## Pré-requisitos
- HTML Nativo instalado (`primevue@^5.0`)
- Pinia instalado (`pinia@^4.0`)
- Vue Router instalado (`vue-router@^5.3`)

## Código Completo

```typescript
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
```

## O que muda em relação ao original

| Antes | Depois |
|-------|--------|
| Sem HTML Nativo | `app.use(HTML Nativo, { unstyled: true })` |
| Sem ToastService | `app.use(ToastService)` |
| 2 imports | 4 imports |

## Notas
- `{ unstyled: true }` significa que HTML Nativo NÃO injeta CSS. Todo styling é manual (ver contexto 15 para CSS)
- `ToastService` é necessário para `useToast()` funcionar nos componentes
- O `router` pode ter rotas vazias por ora (`routes: []`) — a app é single-page sem navegação
- O Pinia deve ser registrado ANTES dos stores serem usados nos componentes

## Arquivo `src/router/index.ts` (manter como está)

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [],
})

export default router
```

## Arquivo `src/stores/counter.ts` (PODE SER REMOVIDO)

O store `counter.ts` que veio do template Vue não é mais usado. Pode ser deletado:

```bash
rm src/stores/counter.ts
```
