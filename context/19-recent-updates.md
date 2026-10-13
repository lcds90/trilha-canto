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

