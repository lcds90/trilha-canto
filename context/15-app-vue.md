# Contexto 15 — App.vue (Layout Principal e Responsividade)

Este documento documenta o componente raiz `src/App.vue`, responsável pelo gerenciamento de layout (Desktop e Mobile/Bottom Sheet), redimensionamento dinâmico e integração com o PWA.

## Arquitetura de Layout

- **Desktop (telas > 768px):**
  - Layout flex horizontal composto por `RoadmapScene.vue` na área principal (`.main-content`) e `PlayerControls.vue` na barra lateral (`.sidebar`).
  - Barra divisória redimensionável (`.resizer`) com suporte a Pointer Events (`@pointerdown`), `setPointerCapture` e persistência de largura no `localStorage` (`trilha-canto-sidebar-width`).
  - Alternância de posição da barra lateral (Esquerda / Direita) via `provide('toggleSidebarPosition')` e persistência em `trilha-canto-sidebar-pos`.

- **Mobile (telas ≤ 768px):**
  - Layout flex vertical (`flex-direction: column !important`).
  - O resizer desktop é ocultado.
  - A barra lateral transforma-se em um **Bottom Sheet** nativo:
    - Alça de arraste superior (`.sheet-handle` com `.sheet-grabber`).
    - Dois estados de altura (`sheetState`):
      - `'half'` (58dvh): permite visualizar a trilha 3D e operar o player simultaneamente.
      - `'full'` (`calc(100dvh - 110px)`): expande o painel para edição de exercícios e configuração do metrônomo.
    - Suporte a toque e gestos de swipe (arraste vertical para expandir ou recolher).
    - Modo paisagem (landscape em celulares): preserva divisão horizontal lado a lado sem esmagamento.
    - Safe-area insets (`env(safe-area-inset-top)` e `env(safe-area-inset-bottom)`).

- **PWA (Ciclo de Vida e Atualizações):**
  - Integração com `usePwa()`:
    - Toast visual (`.pwa-toast`) notificando novas versões disponíveis (`needRefresh`) com botão de atualização instantânea (`applyUpdate()`).
    - Notificação temporária de disponibilidade offline (`offlineReady`).

- **Reset Diário de Rotina:**
  - Verifica no `onMounted` a data atual via `getLocalDayISO()` contra `localStorage.getItem('trilha-canto-last-active')`. Caso o dia tenha virado, aciona `routineStore.resetDaily()` preservando o progresso da sessão até o dia seguinte.

- **Modal de Celebração de Treino Concluído (`WorkoutCelebrationModal.vue`):**
  - Renderizado no nível raiz de `App.vue` (`z-index: 12000`) sob condição `v-if="routineStore.showCompletionCelebration"`.
  - Exibe animação centralizada com som de efeito festivo Web Audio API, chuva de confetes, balões animados, pulso sonar concêntrico e mensagem "Treino concluído 🎉🎈🎤".
  - Fecha ao clicar em "Continuar", no backdrop, no botão fechar (✕), tecla `Escape` ou automaticamente após 8 segundos.
