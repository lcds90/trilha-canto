# Histórico de Atualizações Recentes

Este documento resume as melhorias, correções de bugs e evoluções de UI/UX aplicadas recentemente no projeto **Trilha de Canto**.

## 1. Correções do Player de Vídeo e Carrossel
- **Bug da Tela Preta**: Resolvido o problema de transição de vídeos do YouTube no carrossel. O componente `YouTubePlayer.vue` agora recebe uma `:key="currentVideoId"` para forçar a reconstrução do iframe ao trocar de vídeos, permitindo que a API do YouTube seja inicializada de forma limpa.
- **Remoção de Pontos do Carrossel**: A interface antiga de paginação via "bolinhas" foi removida. Em vez disso, inseriu-se um contador minimalista diretamente no título da seção em `.active-info` (ex: \`Vídeo 1 / 3\`).
- **Ajuste de CSS (Iframe)**: Corrigido o bug onde o iframe do YouTube não ocupava os 100% do container devido à perda de atributos `data-v` do Vue; foi implementado um `.youtube-wrapper :deep(iframe)` definindo width/height totais.

## 2. Refatoração do `PlayerControls.vue`
- O controle de alternância "Avançar automaticamente", botões de play e slider de volume foram agrupados num único container limpo (\`.controls-card\`), eliminando as bordas soltas de "toggles".
- O controle de volume agora tem barra cinza, e o ícone de áudio atua como botão de Mudo com fallback para o último volume ativo.
- O botão manual "✅ Concluir Sessão Diária" foi completamente removido. O disparo da conclusão da sessão agora ocorre automaticamente via um \`watch\` em \`routineStore.isAllCompleted\`.
- O layout de progresso na barra lateral foi polido. Ao atingir 100%, a barra se torna um gradiente verde pulsante, e o título se altera dinamicamente para "Sessão concluída 🚀" com animação bounce. O container `.progress-section` ganha um brilho sutil.
- Removida a classe genérica \`.completed-text\` de textos que ficavam verdes para preservar um alto contraste em branco, focando a coloração verde nos ícones e barras de progresso.
- Criada uma barra de rolagem minimalista personalizada no \`player-sidebar\`, além de fixar \`overflow-y: scroll\` para não haver shifts indesejados no layout.

## 3. Navegação por Query Parameters
- Sincronização bidirecional de URL implantada sem necessidade de \`vue-router\` intrusivo. Os parâmetros \`?section=1&exercise=1\` refletem e determinam os índices \`activeNodeIndex\` e \`activeExerciseIndex\`.
- Adição da query string \`&isEdit=true\` que automaticamente inicializa a aba de edição para aquela seção.
- O estado reage a interações na UI (atualizando a barra de endereços dinamicamente via \`replaceState\`) e vice-versa.

## 4. Melhorias do Modo de Edição
- A seção inteira de edição recebeu um \`input\` permitindo que o título geral da seção (e.g. "Respiração e Suporte") possa ser customizado.
- Foi implementado um botão **Restaurar padrão** (🔄) capaz de resetar a seção ativa recuperando dados do \`DEFAULT_NODES\` original do \`routineStore.ts\`, caso o usuário queira restaurar os exercícios originais.

## 5. Nova Feature: IA e Conselho do Amigo (Firebase/Firestore)
- Introdução do componente \`DailyAdvice.vue\` para exibir dicas diárias usando o Gemini via \`firebase/ai\`.
- Para poupar cota diária (Spark Plan), as mensagens são registradas no **Firestore** sob uma coleção \`daily_advice\` com a chave sendo a data do dia corrente (\`YYYY-MM-DD\`). O app só consome IA se o campo da dica do dia não existir.
- **Fluxos do Conselho**:
  - **Welcome (No Params)**: Se o usuário abrir o app sem selecionar nenhuma seção, é verificado o estado da ofensiva (Streak), dando as boas-vindas para iniciantes, parabenizando por ter praticado hoje, ou encorajando se já tiver uma ofensiva.
  - **Contextual por Seção**: O prompt da IA recebe o objeto \`RoadmapNode\` inteiro, sabendo os nomes exatos dos exercícios da etapa selecionada e, opcionalmente, enfatizando vídeos.
- O \`DailyAdvice\` foi reposicionado para o conteúdo expansível (\`.collapsible-content\`) do \`player-sidebar\`, abaixo do calendário da ofensiva, junto de um ícone brilhante (\`✨\`) de notificação caso não tenha sido lido.

## 6. Lógica Refinada da Ofensiva (Streak)
- Textos de pluralização arrumados (1 dia / 2 dias).
- Correção crítica no "Reset Diário": Anteriormente os itens da checklist ficavam cinzas no exato momento da conclusão da sessão, anulando a satisfação do usuário de ver tudo completado. Agora o \`routineStore.resetDaily()\` foi movido para a inicialização no \`App.vue\`. Compara-se a data em localStorage (\`trilha-canto-last-active\`) e o reset do diagrama visual só ocorre quando detecta a virada do dia para a próxima sessão de treinos.

Estes logs registram a migração do fluxo original para uma experiência de SPA interativa, context-aware e totalmente polida.

## 7. Integração de Autenticação Google e Firestore Sync
- Implementação de Login social utilizando o Firebase Authentication (Google).
- Sincronização do estado de rotina e ofensiva (streak) com o Firestore para persistência em nuvem.
- Estrutura de dados refinada: `routine` e `streak` agora são salvas diretamente como propriedades no documento raiz do usuário (`users/{uid}`), utilizando `{ merge: true }` para não sobrescrever dados mutuamente.
- Nova store `auth.ts` foi introduzida para gerenciar o estado da sessão e carregar as rotinas logo após o login.
- Cabeçalho da barra lateral adaptado para exibir avatar/nome e os controles de login/logout.

## 8. Novo Metrônomo Interativo com Síntese Web Audio e Animações no Diagrama
- **Metronome Store (`metronome.ts`):** Criada store Pinia com agendador de alta precisão (lookahead scheduler Chris Wilson de 25ms/100ms) eliminando drift e garantindo tempo musical impecável.
- **5 Timbres Sintetizados:** Bloco de Madeira (`woodblock`), Beep Digital (`beep`), Baqueta (`stick`), Campana (`cowbell`) e Gota Pop (`pop`), sintetizados via osciladores, filtros e ruído da Web Audio API sem necessidade de arquivos externos de áudio.
- **Controle Flexível de Tempo e Compasso:**
  - BPM de 30 a 260 com steppers (±1, ±5), slider contínuo, andamento italiano (Largo até Presto) e botão **Tap Tempo**.
  - Batidas por compasso (1 a 12), com presets 1 (livre), 2/4, 3/4, 4/4 e 6/8, com acento diferenciado na primeira batida.
  - Persistência das preferências em `localStorage`.
- **UI Integrada (`MetronomeWidget.vue`):** Inserido junto aos controles do player em `PlayerControls.vue`, com visualizador de batidas, mini-bar superior, painel expansível e controle de volume.
- **Atalho Global:** Tecla `M` alterna o metrônomo instantaneamente de qualquer lugar da aplicação.
- **Animação Visual no Diagrama 3D (`RoadmapScene.vue`):**
  - Pulso físico via GSAP e onda de choque concêntrica (sonar wave) emanando do nó da seção ativa a cada batida, com destaque dourado no tempo forte.
  - Trajeto iluminado pulsa ritmicamente durante a execução.
  - Floating HUD no topo da cena 3D exibindo mini-pêndulo oscilante, contagem de batidas, BPM e botão de parada direta.

## 9. Reordenação de Exercícios no Modo de Edição
- **Reordenação Flexível por Drag and Drop e Botões:**
  - Adicionado suporte a arrastar e soltar (HTML5 Drag & Drop) diretamente na alça de pegada `⋮⋮` (`.drag-handle`) com cursor `grab`/`grabbing` e feedback visual nos cards durante o arraste (`.is-dragging`, `.drop-target-top`, `.drop-target-bottom`).
  - Botões dedicados de passo a passo (▲ e ▼) em cada card de exercício para reordenação com 1 clique (com estado desabilitado inteligente no topo e na base).
  - Badge numérico `#1`, `#2`, etc. identificando a posição ordinal de cada exercício.
- **Store `routine.ts`:**
  - Implementadas as ações `reorderExercises(nodeId, fromIndex, toIndex)`, `moveExerciseUp(nodeId, index)` e `moveExerciseDown(nodeId, index)` com validações de limites e salvamento automático.
- **Preservação de Contexto do Player:**
  - Quando a seção sendo editada é a seção ativa no player, a reordenação rastreia o `id` do exercício atualmente selecionado e atualiza `activeExerciseIndex` para acompanhar a nova posição, evitando que a reprodução ou seleção mude inesperadamente.
- **Suporte no `ExerciseModal.vue`:**
  - Adicionados botões ▲ e ▼ com suporte a reordenar exercícios diretamente no modal de detalhes.
- **Cobertura de Testes E2E:**
  - Testes automatizados Playwright adicionados cobrindo reordenação por botões e via eventos Drag & Drop.

## 10. Responsividade Móvel e PWA (Instalação no Celular e Desktop)
- **Instalação do App (PWA):**
  - Configurado `vite-plugin-pwa` no `vite.config.ts` com manifest completo (`id`, `name`, `short_name`, `theme_color: #080816`, `background_color: #080816`, `display: standalone`, `display_override: ['standalone', 'minimal-ui']`).
  - Geração de ícones PNG para todas as resoluções essenciais (`64x64`, `192x192`, `512x512`, `maskable-icon-512x512` e `apple-touch-icon-180x180`) a partir de `public/icon.svg`.
  - Service Worker com Workbox ativo em produção: precache dos assets do app shell e runtime caching de Google Fonts e thumbnails com estratégia `StaleWhileRevalidate`.
  - Composable dedicado `src/composables/usePwa.ts`: singleton que captura o evento `beforeinstallprompt`, detecta modo standalone e iOS (Safari), e provê métodos para disparo de instalação (`promptInstall`), notificação de atualização (`needRefresh`, `applyUpdate`) e uso offline (`offlineReady`).
  - Botão e chip de instalação ("📲 Instalar") incorporados diretamente no cabeçalho e card interno de `PlayerControls.vue`, além de guia com passo a passo para usuários de iOS ("Compartilhar" -> "Adicionar à Tela de Início").
  - Toast interativo em `App.vue` notificando quando uma nova versão estiver disponível ou quando o app estiver pronto para uso offline.

- **Responsividade Móvel Fluida (Mobile & Tablet):**
  - **Bottom Sheet Dinâmico (`App.vue`):** Em telas estreitas (≤ 768px), o layout altera de colunas para disposição vertical. A sidebar é transformada num bottom sheet deslizante com alça tátil (`.sheet-handle`), permitindo alternar suavemente entre visualização compacta (`half`, 58vh) e tela inteira (`full`, 100dvh - 110px) via toque ou swipe vertical.
  - **Modo Paisagem em Celulares:** Detecta orientação landscape e preserva disposição lado a lado sem espremer o conteúdo.
  - **Safe Area Insets & 100dvh:** Suporte a entalhes (notches) e barras de navegação do iOS/Android via `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)`.
  - **Redimensionamento por Toque:** Resizer adaptado com Pointer Events e `setPointerCapture` para funcionar em telas touch e tablets.
  - **Roadmap Compacto (`RoadmapScene.vue`):** Análise dinâmica de largura via `ResizeObserver`. Em containers estreitos (< 640px), os nós diminuem para 60px e são ancorados à esquerda com curva Bezier otimizada, enquanto a lista contextual de exercícios é ancorada à direita ocupando a largura restante com scroll vertical independente (`touch-action: pan-y`). O floating HUD do metrônomo se reposiciona no canto superior direito respeitando a safe area.
  - **Otimização Touch em `PlayerControls.vue`:** Áreas de clique ampliadas (48-64px), prevenção de zoom acidental do iOS Safari (base font de 16px para inputs), formulário de edição responsivo com flex-wrap em campos de mídia e quebra fluida, e ocultação automática de atalhos de teclado físicos em dispositivos com ponteiro touch (`pointer: coarse`).

## 11. Player Minimalista, Checkbox Junto ao Player, Metrônomo + Temporizador Lado a Lado e Voice Coach
- **Checkbox de Concluir Aula Integrado ao Player:**
  - O checkbox de conclusão do exercício ativo foi reposicionado diretamente para a barra de transporte de áudio/vídeo (`.playback-main-row`), ficando alinhado lado a lado com os botões ⏮ (Voltar), ▶/⏸ (Play/Pause) e ⏭ (Avançar).
  - Feedback visual imediato com caixa de marcação personalizada, transição para verde esmeralda (`#22c55e`), ícone SVG de checkmark e rótulo dinâmico "Concluir" / "Concluído".
  - Totalmente compatível com o atalho de teclado global `C`.
- **Temporizador de Prática (Metrônomo por X Tempo):**
  - Adicionado suporte a contagem regressiva para prática vocal com metrônomo.
  - Presets rápidos de 30s, 1m, 2m, 3m, 5m ou modo livre (∞), e botões de passo de ±15s.
  - Ao término do tempo configurado, o metrônomo para automaticamente, marca o exercício como concluído e avança para o próximo exercício na rotina.
- **Voice Coach (Voz Sintetizada Web Speech API):**
  - Criação do composable `src/composables/useVoiceCoach.ts` com suporte à voz em Português do Brasil (`pt-BR`).
  - Anuncia verbalmente `"Iniciando"` ao disparar o temporizador, metrônomo ou vídeo de treino.
  - Anuncia verbalmente `"Finalizado"` ao término do temporizador de prática ou quando o vídeo do YouTube chega ao fim.
  - Botão de toggle rápido (`🎙️ Voz On / 🔇 Voz Off`) na barra secundária do player com persistência local.
- **Módulo Unificado de Prática (Acima do Player):**
  - `MetronomeWidget.vue` foi unificado em **1 único card minimalista** contendo tanto o Metrônomo quanto o Temporizador com um botão mestre de reprodução conjunta (`Iniciar` / `Parar`).
  - Painel dividido internamente: à esquerda o Metrônomo (BPM, Tap Tempo, slider e beat dots); à direita o Temporizador (display digital MM:SS, steppers ±15s, chips de presets 30s-5m-∞ e barra de progresso suave).
  - Gaveta retrátil para opções avançadas de áudio, timbres, compasso e volume.
- **Refatoração Minimalista Completa do Player:**
  - Remoção de bordas pesadas e sombras skeuomórficas 3D em favor de uma estética moderna, limpa e plana.
  - Barra de progresso ultrafina no topo do cabeçalho da seção.
  - Linha secundária discreta com controle de volume, checkbox de auto-avanço e controle de voz.

## 12. Celebração de Conclusão de Treino: Animação Centralizada e Efeito Sonoro ("Treino concluído 🎉🎈🎤")
- **Disparo Automático ao Concluir Todas as Seções:**
  - Ao completar todos os exercícios e nós de rotina (`routineStore.isAllCompleted`), um modal animado centralizado na tela (`WorkoutCelebrationModal.vue`) é disparado de forma automática e reativa.
  - A store `routine.ts` expõe `showCompletionCelebration`, `triggerCelebration()` e `dismissCelebration()`, com salvaguarda na inicialização do app para não disparar em carregamentos repetidos de página.
- **Efeito Sonoro Festivo (Fanfarra Web Audio API):**
  - Implementado em `src/lib/celebrationSound.ts` utilizando Web Audio API nativo sem necessidade de arquivos externos de áudio.
  - Sintetiza arpeggio ascendente triunfal (C5, E5, G5, C6, E6) com harmônicos combinados (triângulo + seno) e acorde final ressonante sustentado com brilho de sinos (sparkles).
  - Integrado ao Voice Coach (`useVoiceCoach.ts`), que anuncia verbalmente "Treino concluído!" caso a síntese de voz esteja ativada.
- **Animação Visual Centralizada:**
  - Exibe na tela o título exato: **"Treino concluído 🎉🎈🎤"** em tipografia gradiente (dourado, esmeralda e azul).
  - Entrada elástica com GSAP (`back.out(1.8)`), pulso sonar concêntrico triplo e brilho radial em glassmorphism.
  - Partículas festivas animadas: balões (🎈) subindo suavemente com oscilação física, explosão 360° de confetes coloridos e emojis flutuantes (🎉, 🎤, 🎵, 🎶, ✨, 🌟).
  - Exibição de estatísticas: total de seções concluídas, dias consecutivos de ofensiva (Streak 🔥) e mensagem de incentivo.
  - Botão "Continuar 🚀", botão "Tocar Som 🔔" para reprodução sob demanda, botão de fechar (✕) e barra de progresso para fechamento automático suave após 8 segundos.
- **Cobertura de Testes E2E (Playwright):**
  - Teste automatizado em `e2e/vue.spec.ts` validando o acionamento do overlay, presença do texto "Treino concluído 🎉🎈🎤", botões interativos e fechamento.

