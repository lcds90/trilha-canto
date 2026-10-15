# Contexto: Trilha de Prática de Canto — App 3D Interativo

Este documento registra o escopo e contexto para o aplicativo "Trilha de Prática de Canto", um app de rotina de prática vocal com roadmap 3D animado.

## Objetivo do Projeto
App de rotina interativa para guiar a prática diária de canto. O usuário navega entre seções (nós do roadmap) num ambiente 3D, marca exercícios como concluídos, adiciona novos exercícios com links de vídeo, recebe análise personalizada via IA generativa (Gemini), e rastreia sua ofensiva (streak) de dias consecutivos.

## Stack Tecnológico
- **Framework:** Vue 3 (Composition API, `<script setup>`)
- **Linguagem:** TypeScript (~6.0)
- **Build:** Vite (^8.2)
- **Animações e Câmera:** GSAP (^3.12) — cena 2D/3D simulada usando DOM nativo e SVG paths
- **UI Components:** Native HTML/CSS
- **Estado:** Pinia (^4.0) — stores: routine, player, streak, aiUsage, auth, metronome
- **Backend:** Firebase (plano Spark) — apenas AI Logic
- **IA:** Firebase AI Logic + Gemini 2.5 Flash — análise de seções
- **Persistência:** localStorage (offline) e Firestore (sync cloud via Autenticação Google)
- **Áudio:** Web Audio API nativo — síntese e agendamento de alta precisão (lookahead scheduler) para metrônomo
- **PWA e Offline:** vite-plugin-pwa (^2.0) com Workbox para precaching do app shell e suporte a instalação nativa (celular e desktop)

## Estrutura de Seções (Roadmap)

1. **Respiração e Suporte** (tempo flexível)
   - Inspiração/expiração livres, sons de 's'/'f'/'x' em staccato, contagem de tempo
2. **Aquecimento Corporal** (+/- 15 min)
   - Alongamento, articulações, massagens cervical/crânio/face/laringe, aviãozinho
3. **Aquecimento Vocal** (~ 2 min)
   - Vibração de língua/lábios, estalos de língua, giro de língua
4. **Vocalizes** (+/- 20 min)
   - Aquecimento laríngeo, ressonância, abertura/voz na máscara, apoio muscular
5. **Aplicação na Música** (restante do tempo)
   - Aplicar técnicas à música trabalhada, interpretação e dinâmicas

## Funcionalidades Principais

### Instalação como App (PWA para Celular e Desktop)
- **Instalação Nativa:**
  - Suporte completo a Progressive Web App via `vite-plugin-pwa` e manifest web (`manifest.webmanifest`).
  - Instalável em smartphones (Android e iOS) e computadores (Chrome, Edge, macOS, Windows e Linux).
  - Ícones adaptativos completos (`64x64`, `192x192`, `512x512`, `maskable-icon-512x512`, `apple-touch-icon-180x180` e `icon.svg`).
  - Botão e chip de instalação rápida ("📲 Instalar") integrados diretamente no cabeçalho do player e no card expansível, com instruções passo a passo para iOS Safari.
  - Service worker com precache de assets do app shell e cache runtime para fontes e imagens/thumbnails.
  - Notificação discreta via toast em `App.vue` para novas versões disponíveis e aviso de prontidão offline.

### Responsividade Móvel e Bottom Sheet
- **Bottom Sheet Dinâmico (`App.vue`):** Em telas estreitas (≤ 768px), o layout converte-se para vertical e a sidebar vira um bottom sheet deslizante com alça de toque (`.sheet-handle`). Alterna suavemente entre modo meia-tela (`half`, 58vh) e tela cheia (`full`, 100dvh - 110px) via clique ou swipe vertical.
- **Detecção de Orientação:** Em smartphones em paisagem (landscape), preserva a visualização lado a lado sem distorção.
- **Modo Compacto do Roadmap (`RoadmapScene.vue`):** Em larguras inferiores a 640px (`ResizeObserver`), os nós reduzem para 60px e são ancorados à esquerda da tela, com a lista lateral de exercícios ancorada à direita aproveitando o espaço restante e com rolagem vertical independente (`touch-action: pan-y`). O HUD do metrônomo adapta-se ao canto superior direito respeitando a safe area.
- **Adaptação Touch:** Alvos de toque ampliados (48-64px), prevenção de zoom indesejado no iOS Safari com fonte mínima de 16px para inputs e ocultação automática de atalhos de teclado físicos em telas puramente touch.

### Cena Dinâmica (GSAP + SVG)
- Nós flutuantes animados com curva Bezier fluida conectando o trajeto
- Partículas (estrelas) de fundo com paralaxe
- Câmera centraliza suavemente no exercício ativo via GSAP (eixo Y)
- É possível arrastar para navegar pelo mapa livremente
- Cores dinâmicas: Verde (concluído), Amarelo (em progresso), Opaco (inativo)
- A cada seção, uma lista contextual (`.exercise-side-list`) é exibida com os exercícios pertencentes

### Gestão de Exercícios (Modo de Edição)
- Acionado via botão ⚙️ ou pelo botão Editar (✏️) nos modais ou atalho `E`
- Permite Adicionar, Editar, Excluir e **Reordenar** exercícios daquela seção
- **Reordenação Flexível:**
  - Drag and Drop nativo (HTML5) através da alça de arrasto `⋮⋮` com feedback visual nos cards (`.is-dragging`, `.drop-target-top`, `.drop-target-bottom`).
  - Botões dedicados de passo a passo (▲ e ▼) em cada card de exercício para mover 1 posição para cima ou para baixo com 1 clique.
  - Badges ordenais `#1`, `#2`, etc. identificando a posição exata.
  - Sincronização automática com a reprodução: preserva o foco do exercício ativo no player mesmo após ser reposicionado.
- Campos Suportados: Nome, Notas (Rich Text Editor Tiptap) e Lista de Mídias (Vídeos de YouTube com duração calculada ou Referências como links externos/PDFs)
- Transforma a Sidebar ou abre edição inline no Modal
- Salvamento automático via Vue Reactivity e `localStorage` (com sincronização em nuvem no Firestore se logado)

### Sidebar Principal (Player Minimalista & Status)
- Disposição responsiva que pode ser redimensionada e trocada de lado (Esquerda/Direita)
- **Cabeçalho Minimalista:** Exibe o título da seção, estatísticas compactas de progresso e barra de progresso ultrafina. Mantém cabeçalho colapsável no topo com Autenticação, instalação PWA, Streak e Atalhos.
- **Mídia 16:9:** Área dedicada para vídeos do YouTube e visualização limpa de notas/referências.
- **Módulo Unificado de Prática (Acima do Player):** Metrônomo e Temporizador integrados em um único card (`MetronomeWidget.vue`) logo acima dos controles de reprodução.
- **Controles de Reprodução Minimalistas:**
  - Linha principal unificada:⏮, ▶/⏸, ⏭ e **Checkbox de Conclusão de Aula** lado a lado (`.complete-toggle-pill`).
  - **Checkbox Junto ao Player:** O usuário marca ou desmarca a conclusão do exercício diretamente na barra de transporte com um clique ou via atalho `C`.
  - Linha secundária compacta: Slider discreto de volume, toggle de "Avançar automaticamente" e botão do **Voice Coach** (`🎙️ Voz On/Off`).
- **Atalhos de Teclado Globais:** Space (Play/Pause), Setas Esquerda/Direita (Voltar/Avançar), C (Concluir), M (Metrônomo), T (Timer), H (Header), E (Modo de Edição), Esc (Sair).
- **Auto-advance:** Avança automaticamente para o próximo exercício ao concluir (via timer ou checkbox).

### Metrônomo e Temporizador Integrados (Web Audio API & Voice Coach)
- Localizado acima do player na sidebar (`MetronomeWidget.vue`), unificado em um único card minimalista com botão mestre de reprodução conjunta.
- **Painel Central do Card Unificado:**
  - **Lado Esquerdo (Metrônomo):** Mostrador de BPM com steppers (-5, +5), botão de **TAP TEMPO**, slider contínuo de andamento e visualizador de batidas (`● ● ○ ○`).
  - **Lado Direito (Temporizador):** Display digital de contagem regressiva `MM:SS` com steppers rápidos (±15s), chips de presets (30s, 1m, 2m, 3m, 5m, ∞) e barra de progresso suave.
- **Módulo Temporizador de Prática (Timer):**
  - Configuração do metrônomo para tocar por X tempo com parada automática.
  - **Presets Rápidos:** 30s, 1m, 2m, 3m, 5m ou modo livre (∞), além de steppers finos (±15s).
  - **Display Digital e Progresso:** Exibição clara de contagem regressiva `MM:SS` com barra de progresso dinâmica.
  - **Sincronização:** Opção de tocar o metrônomo durante a contagem (`⏱️ Sinc`) ou temporizador silencioso.
  - **Conclusão e Avanço Automático:** Ao zerar o tempo X, conclui automaticamente o exercício na rotina e avança para o próximo.
- **Voz Sintetizada (Voice Coach - Web Speech API pt-BR):**
  - Anuncia verbalmente `"Iniciando"` ao começar o temporizador, metrônomo ou vídeo.
  - Anuncia verbalmente `"Finalizado"` ao término do temporizador de prática ou ao final do vídeo de treino.
  - Chip dedicado para ativar ou silenciar a voz a qualquer momento (`🎙️ Voz On/Off`).
- **Sincronização Visual e no Diagrama:**
  - Visualizador de batidas minimalista (dots pulsantes no nó e na barra).
  - No diagrama 3D (`RoadmapScene.vue`): pulsação elástica no nó ativo com GSAP, sonar waves, trajeto iluminado e Floating HUD.

### Streak (Ofensiva)
- Dias consecutivos de prática (current + recorde)
- Calendário visual dos últimos 30 dias (grid 7x~5)
- Animação de pulso no emoji de fogo
- Persiste em localStorage

### IA Generativa (Firebase AI Logic)
- Modelo: Gemini 2.5 Flash via `firebase/ai`
- Analisa seção ativa: gera feedback + sugestões
- Rate limiting local: 1500 req/dia, 10 req/min
- Avisos progressivos: 80% (amarelo), 95% (vermelho), 100% (bloqueio)

## Firebase (Plano Spark)
- Config via `.env` com prefixo `VITE_`
- Projeto: `app-trilha-de-canto`
- Limites Spark: 1500 req/dia Gemini Flash, 10 req/min
- Auth: Google Authentication
- DB: Firestore para sincronização de rotina e streak entre dispositivos. Estrutura:
  - Coleção `users` -> documento `{uid}` contendo os campos `{ routine, streak }`
- Sem Cloud Storage (vídeos por URL externa)

## Design e Estilização
- Tema escuro (#080816) com glassmorphism
- Amarelo (#ffe500) para nós ativos e acentos
- Verde (#22c55e) para completados e streak
- Roxo (#8b5cf6) para IA
- Native HTML/CSS customizado
- Responsivo (mobile-first)

## Estrutura de Arquivos
```
src/
├── lib/firebase.ts, ai.ts
├── types/index.ts
├── stores/routine.ts, player.ts, streak.ts, aiUsage.ts, auth.ts, metronome.ts
├── composables/useThreeScene.ts, usePwa.ts, useVoiceCoach.ts
├── components/RoadmapScene.vue, ExerciseModal.vue, PlayerControls.vue, StreakPanel.vue, MetronomeWidget.vue
├── App.vue, main.ts, router/index.ts
```

## Plano Futuro (Blaze)
- Migrar para plano Blaze (custo zero dentro dos limites)
- Ativar Cloud Storage para upload de vídeos de prática

## Regras de Workflow do Agente (CRITICAL)
- **ATENÇÃO ANTES DE COMMITAR:** Sempre antes de realizar qualquer `git commit` ou criar pull requests, o agente DEVE revisar e atualizar a documentação presente na pasta `/context` e o arquivo `GEMINI.md`. É responsabilidade do agente garantir que a documentação de arquitetura, estados (stores), componentes e regras esteja sempre sincronizada com o código atual antes de persistir as mudanças no repositório.
