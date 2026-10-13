# Contexto 23 — PWA e Responsividade Móvel

Este documento detalha o suporte a Progressive Web App (PWA) e a arquitetura de responsividade móvel introduzidos no aplicativo **Trilha de Canto**.

## 1. Suporte PWA (Instalação no Celular e Desktop)

### Objetivo
Permitir que o aplicativo seja instalado em qualquer dispositivo (Android, iOS, Windows, macOS, Linux) diretamente pelo navegador, com inicialização instantânea, atalho na tela inicial ou na barra de tarefas, e modo standalone sem barra de endereço do navegador.

### Ferramentas e Configuração
- **Dependência:** `vite-plugin-pwa` e `workbox-window`.
- **Configuração no `vite.config.ts`:**
  - Plugin `VitePWA` configurado com `registerType: 'prompt'` e `injectRegister: false`.
  - Manifest Web completo (`manifest.webmanifest`):
    - `id: '/'`, `name: 'Trilha de Prática de Canto'`, `short_name: 'Trilha Canto'`.
    - `theme_color: '#080816'`, `background_color: '#080816'`.
    - `display: 'standalone'`, `display_override: ['standalone', 'minimal-ui']`.
    - Ícones configurados em `public/`:
      - `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`.
      - `maskable-icon-512x512.png` com `purpose: 'maskable'`.
      - `icon.svg` com `sizes: 'any'`.
  - Workbox configurado para precache de assets do app shell e runtime caching de Google Fonts e thumbnails do YouTube.
- **HTML (`index.html`):**
  - `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">`
  - `<meta name="theme-color" content="#080816">`
  - `<meta name="apple-mobile-web-app-capable" content="yes">`
  - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
  - `<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">`

### Composable `src/composables/usePwa.ts`
- Singleton instanciado na inicialização via `initPwa()` em `src/main.ts`.
- Captura o evento nativo `beforeinstallprompt` (Chrome, Edge, Android) para permitir que a interface acione a instalação via botão.
- Detecta modo standalone (`display-mode: standalone` e `navigator.standalone`).
- Detecta dispositivos iOS (onde a instalação é manual via "Compartilhar" -> "Adicionar à Tela de Início").
- Gerencia o ciclo de vida do Service Worker (`registerSW`):
  - `needRefresh`: sinaliza nova versão disponível.
  - `offlineReady`: sinaliza que a aplicação está pronta para rodar offline.
  - `applyUpdate()`: recarrega a aplicação aplicando a nova versão do cache.

---

## 2. Responsividade Móvel (Mobile & Tablet)

### Bottom Sheet Dinâmico (`App.vue`)
- Em telas ≤ 768px (`max-width: 768px`), o layout de desktop de colunas horizontais (`app-layout`) converte-se em layout vertical móvel.
- O resizer de redimensionamento desktop é ocultado e a barra lateral transforma-se em um **Bottom Sheet** animado (`.sidebar`):
  - Alça tátil superior (`.sheet-handle` e `.sheet-grabber`) para interação por toque.
  - Dois estados de altura:
    - **`half`**: 58vh/58dvh, permitindo visualizar a rota/mapa acima enquanto se opera o player.
    - **`full`**: `calc(100dvh - 110px)`, proporcionando tela cheia para gerenciar exercícios, editar seções e configurar o metrônomo.
  - Gestos de swipe vertical na alça (arraste para cima expande para `full`, arraste para baixo recolhe para `half`).
  - Suporte a orientação horizontal em celulares (`max-height: 500px` em landscape), preservando divisão lado a lado 50/50.
  - Respeito integral à safe area do iOS (`env(safe-area-inset-top)` e `env(safe-area-inset-bottom)`).

### Roadmap Compacto e Responsivo (`RoadmapScene.vue`)
- Utiliza `ResizeObserver` no container principal para reagir a redimensionamentos da tela e expansão do bottom sheet sem depender apenas de `window.resize`.
- Em larguras menores que 640px (`isCompact`):
  - Nós do roadmap diminuem de 80px para 60px com espaçamento Y reduzido para 200px.
  - Curva Bezier e trajeto luminoso são ancorados no lado esquerdo da tela (`trackLeft: 50px`).
  - A lista contextual de exercícios é ancorada à direita ocupando a largura restante da tela, com rolagem vertical independente e sem interferir no drag do mapa (`touch-action: pan-y`).
  - HUD flutuante do metrônomo move-se para o canto superior direito com paddings adaptados à safe area.

### Controles Touch-Friendly (`PlayerControls.vue`)
- Em dispositivos móveis, o cabeçalho expansível inicia recolhido para priorizar o player e os exercícios.
- Ao entrar no modo de edição em mobile, o bottom sheet expande automaticamente para `full`.
- Botões de reprodução e navegação com áreas mínimas de toque ampliadas (48px a 64px).
- Atalhos de teclado são ocultados em telas exclusivamente touch (`pointer: coarse`).
- Campos de texto e inputs evitam zoom involuntário no iOS Safari mantendo fonte mínima de 16px.
- Botão "📲 Instalar" visível no cabeçalho e card com instruções detalhadas para iOS dentro das opções.
