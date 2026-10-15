# Contexto 01 — Visão Geral e Arquitetura

> Documento de referência. Não gera código diretamente — serve como contexto para todos os outros módulos.

## Objetivo do App
App de rotina de prática de canto com roadmap visual 3D animado (Three.js). O usuário navega entre 5 seções (nós do roadmap), marca exercícios como concluídos, adiciona novos com links de vídeo, recebe análise de IA (Gemini), e rastreia ofensiva (streak) de dias consecutivos.

## Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Vue 3 (Composition API + `<script setup>`) | ^3.5 |
| Linguagem | TypeScript | ~6.0 |
| Build | Vite | ^8.2 |
| 3D | Three.js (raw, sem wrapper) | ^0.186 |
| UI | Native HTML/CSS | ^5.0 |
| Estado | Pinia (Composition API) | ^4.0 |
| Backend | Firebase (plano Spark) | ^12.19 |
| IA | Firebase AI Logic + Gemini 2.5 Flash | via firebase SDK |
| PWA | vite-plugin-pwa + Workbox | ^2.0 |
| Persistência | localStorage e Firestore | — |

## Árvore de Arquivos

```
src/
├── lib/
│   ├── firebase.ts              # Inicialização Firebase via env
│   └── ai.ts                    # Firebase AI Logic + analyzeSection()
├── types/
│   └── index.ts                 # Interfaces TypeScript
├── stores/
│   ├── routine.ts               # Estado dos nós e exercícios
│   ├── player.ts                # Navegação e auto-advance
│   ├── streak.ts                # Ofensiva e histórico
│   ├── aiUsage.ts               # Rate limiting da IA
│   ├── auth.ts                  # Autenticação Google
│   └── metronome.ts             # Síntese Web Audio e ritmo do metrônomo
├── composables/
│   ├── useThreeScene.ts         # Setup e animação
│   ├── usePwa.ts                # PWA install prompt, service worker e status
│   └── useVoiceCoach.ts         # Síntese vocal Web Speech API (Iniciando / Finalizado)
├── components/
│   ├── RoadmapScene.vue         # Canvas / DOM interativo com GSAP
│   ├── ExerciseModal.vue        # Modal com exercícios + IA
│   ├── PlayerControls.vue       # Player: play/pause/next/prev/shortcuts
│   ├── StreakPanel.vue          # Ofensiva + calendário 30 dias
│   └── MetronomeWidget.vue      # Widget de metrônomo integrado
├── App.vue                      # Layout principal
├── main.ts                      # Entry point
└── router/index.ts              # Vue Router (vazio)
```

## Fluxo de Dados

```
[localStorage] ←→ [Pinia Stores] ←→ [Vue Components]
                       ↕
              [Firebase AI Logic]
                       ↕
              [Gemini 2.5 Flash]

[Three.js Scene] ← observa → [Player Store (activeNodeIndex)]
```

## Seções do Roadmap

1. **Respiração e Suporte** — Tempo flexível
2. **Aquecimento Corporal** — +/- 15 min
3. **Aquecimento Vocal** — ~ 2 min
4. **Vocalizes** — +/- 20 min
5. **Aplicação na Música** — Restante do tempo

## Dependências entre Módulos

```
types/index.ts        ← usado por TODOS os módulos
lib/firebase.ts       ← lib/ai.ts
lib/ai.ts             ← ExerciseModal.vue
stores/routine.ts     ← stores/player.ts, ExerciseModal, PlayerControls, RoadmapScene, App.vue
stores/player.ts      ← PlayerControls, RoadmapScene, App.vue
stores/streak.ts      ← StreakPanel, PlayerControls
stores/aiUsage.ts     ← ExerciseModal
composables/useThreeScene.ts ← RoadmapScene.vue
```

## Ordem de Implementação

1. types → 2. firebase → 3. ai → 4. routine → 5. player → 6. streak → 7. aiUsage → 8. useThreeScene → 9. RoadmapScene → 10. ExerciseModal → 11. PlayerControls → 12. StreakPanel → 13. main.ts → 14. App.vue → 15. GEMINI.md
