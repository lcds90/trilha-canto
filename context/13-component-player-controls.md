# Contexto 13 — Componente: PlayerControls (Player da Rotina)

> Crie o arquivo `src/components/PlayerControls.vue` usando HTML Nativo Button (unstyled).

## Arquivo: `src/components/PlayerControls.vue`

## Pré-requisitos
- `src/stores/player.ts` (contexto 07)
- `src/stores/routine.ts` (contexto 06)
- `src/stores/streak.ts` (contexto 08)

## HTML Nativo Components Usados

```typescript
import Button from 'primevue/button'
```

## Emits

```typescript
const emit = defineEmits<{
  openNode: [index: number]     // Emitido ao clicar no nome do nó ativo (abre modal)
}>()
```

## Stores e Composables Usados

```typescript
const playerStore = usePlayerStore()
const routineStore = useRoutineStore()
const streakStore = useStreakStore()
const authStore = useAuthStore()
const metronomeStore = useMetronomeStore()
const { canInstall, showIOSHint, isInstalled, promptInstall } = usePwa()
```

### Recursos Mobile e PWA
- **Instalação PWA:** Chip `📲 Instalar` no cabeçalho e card com instruções manuais para iOS dentro das opções expansíveis.
- **Adaptação Mobile:** O cabeçalho expansível inicia recolhido em celulares (`!isMobile.value`) para dar espaço ao player e exercícios. Ao entrar em modo de edição, expande o bottom sheet para tela cheia.
- **Touch-Friendly:** Touch targets de 48px a 64px, prevenção de zoom no iOS Safari (inputs com font-size de 16px) e ocultação de atalhos de teclado físicos em dispositivos com ponteiro touch (`pointer: coarse`).

## Computeds

```typescript
const activeNode = computed(() => routineStore.nodes[playerStore.activeNodeIndex]!)

const progressPercent = computed(() => {
  const completed = routineStore.nodes.filter(n => n.completed).length
  return Math.round((completed / routineStore.nodes.length) * 100)
})

const completedCount = computed(() =>
  routineStore.nodes.filter(n => n.completed).length
)

const totalDurationFormatted = computed(() => {
  const total = routineStore.totalDuration
  if (total === 0) return null
  const min = Math.floor(total / 60)
  const sec = total % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
})
```

## Funções

```typescript
function finishSession(): void {
  // 1. Coleta IDs dos nós completados:
  //    const completedIds = routineStore.nodes.filter(n => n.completed).map(n => n.id)
  // 2. Registra prática no streak:
  //    streakStore.recordPractice(completedIds, routineStore.totalDuration)
  // 3. Reseta exercícios do dia:
  //    routineStore.resetDaily()
  // 4. Volta ao primeiro nó:
  //    playerStore.goTo(0)
  // 5. Para o player:
  //    playerStore.isPlaying = false
}
```

## Template — Árvore de Elementos (Layout Minimalista)

```
div.player-sidebar
│
├── div.app-header-collapsible (Cabeçalho colapsável: Perfil, PWA, Streak, Atalhos)
│
├── div.edit-mode-container (v-if="playerStore.editModeNodeId" - Edição & Drag-and-Drop)
│
└── template (v-else - Modo Player Normal)
    │
    ├── div.sidebar-header
    │   ├── div.minimal-progress-row (Seção ativa + progresso em seções)
    │   ├── div.slim-progress-track (Barra de progresso ultrafina de 4px)
    │   └── div.exercise-headline (Título do exercício + contador de mídia)
    │
    ├── section.media-container (Vídeo 16:9 ou Notas/Referências)
    │
    └── div.sidebar-body
        │
        ├── MetronomeWidget (METRÔNOMO E TEMPORIZADOR UNIFICADOS EM 1 CARD - ACIMA DO PLAYER)
        │   └── div.unified-card (Card Único: Metrônomo à esquerda, Temporizador à direita, Play unificado)
        │
        └── div.minimal-player-card (PLAYER MINIMALISTA)
            ├── div.playback-main-row (Controles Principais)
            │   ├── button.nav-btn.prev-btn (⏮ Voltar)
            │   ├── button.primary-play-btn (▶/⏸ Play/Pause)
            │   ├── button.nav-btn.next-btn (⏭ Avançar)
            │   └── button.complete-toggle-pill (CHECKBOX DE COMPLETAR AULA: JUNTO DO PLAYER)
            │       ├── span.pill-check-box (Ícone SVG Check)
            │       └── span.pill-label ("Concluir" / "Concluído")
            │
            └── div.playback-sub-row (Controles Secundários)
                ├── div.minimal-volume-group (Slider de volume quando houver vídeo)
                ├── label.auto-advance-label (Toggle "Auto-avançar")
                └── button.voice-coach-chip (Ativa/desativa voz "Iniciando" e "Finalizado")
```

## CSS

```css
.player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background: rgba(8, 8, 22, 0.9);
  backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255, 229, 0, 0.15);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

/* Barra de progresso */
.progress-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
}

.progress-bar-bg {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffe500, #22c55e);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.7rem;
  color: #94a3b8;
}

/* Controles */
.player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.play-btn {
  width: 44px;
  height: 44px;
  border-radius: 50% !important;
  font-size: 1.2rem;
}

.auto-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #94a3b8;
  cursor: pointer;
}

.auto-toggle input {
  accent-color: #ffe500;
}

/* Info do nó ativo */
.active-info {
  flex: 1;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.active-info:hover {
  background: rgba(255, 229, 0, 0.1);
}

.active-title {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffe500;
}

.active-time {
  font-size: 0.7rem;
  color: #94a3b8;
}

/* Duração total */
.duration-display {
  font-size: 0.8rem;
  color: #94a3b8;
}

/* Botão concluir */
.finish-btn {
  background: rgba(34, 197, 94, 0.2) !important;
  border-color: rgba(34, 197, 94, 0.4) !important;
  color: #22c55e !important;
}

/* Mobile */
@media (max-width: 640px) {
  .player-bar {
    padding: 10px 16px;
    gap: 12px;
  }

  .active-info {
    order: -1;
    flex-basis: 100%;
  }
}
```

## Metrônomo Integrado (`MetronomeWidget.vue`)
O componente `PlayerControls.vue` inclui diretamente o `<MetronomeWidget />` dentro de `.sidebar-body`, logo após o `.controls-card`.
- **Atalho Global:** Tecla `M` alterna Play/Pause do metrônomo instantaneamente.
- **Sincronização:** Opera de forma independente ou em conjunto com a reprodução de mídias e vídeos.

## Modo de Edição e Reordenação de Exercícios
Ao ativar `playerStore.editModeNodeId` (via tecla `E`, botão ⚙️ na cena ou botões de edição), a sidebar se transforma no painel de edição da seção.
- **Reordenação Flexível:**
  - **Drag and Drop Nativo (HTML5):** Alça de arrasto `⋮⋮` com cursor grab/grabbing e classes visuais (`.is-dragging`, `.drop-target-top`, `.drop-target-bottom`).
  - **Botões Passo a Passo:** Botões de reordenação ▲ e ▼ em cada card, permitindo mover 1 posição por clique (desabilitados no topo e no final da lista).
  - **Badges de Posição:** Exibição da ordem numérica atual `#1`, `#2`, etc.
  - **Preservação de Foco:** Se o exercício reordenado for o ativo no player, seu índice é automaticamente atualizado sem interromper a seleção.
  - **Persistência Imediata:** Salva as alterações instantaneamente no `localStorage` e na nuvem (Firestore).
