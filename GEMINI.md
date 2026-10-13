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

### Sidebar Principal (Player & Status)
- Disposição responsiva que pode ser redimensionada e trocada de lado (Esquerda/Direita)
- **Cabeçalho Expansível:** Contém o título, seção de Autenticação (Login com Google/Avatar) e oculta o painel de "Streak" (Ofensiva), o conselho de IA e os Atalhos de Teclado.
- **Progresso:** Calcula o avanço geral baseado no total de *exercícios* concluídos, não só seções
- **Controles:** ⏮, ▶/⏸, ⏭ (Com emissão animada de emojis ao clicar)
- **Atalhos de Teclado Globais:** Space (Play/Pause), Setas Esquerda/Direita (Voltar/Avançar), C (Concluir), H (Header), E (Modo de Edição), M (Alternar Metrônomo), Esc (Sair da edição).
- **Toggles Lado a Lado:** Checkboxes customizados com animações fluidas para "Avançar automaticamente" e "Marcar como Concluído"
- Espaço dedicado (16:9) para exibir vídeos de YouTube incorporados
- **Auto-advance:** Avança automaticamente 1.5s após marcar como concluído

### Metrônomo Integrado (Web Audio API)
- Localizado junto ao Player na sidebar (`MetronomeWidget.vue`), com painel expansível e controle rápido no topo.
- **Controle de Tempo (BPM):** Ajuste de 30 a 260 BPM com steppers (-5, -1, +1, +5), slider contínuo, indicação de andamento tradicional italiano (Largo, Adagio, Andante, Moderato, Allegro, Presto) e botão de **Tap Tempo** com feedback tátil/visual.
- **Batidas por Compasso:** Seleção rápida entre 1 (Livre/sem acento), 2/4, 3/4, 4/4, 6/8 ou stepper para 1 a 12 batidas.
- **Variações de Timbres (5 sons sintetizados):** Madeira (Woodblock), Digital (Beep), Baqueta (Stick), Campana (Cowbell) e Gota Pop (Suave), com preview ao clicar.
- **Sincronização Visual e no Diagrama:**
  - Visualizador de batidas com destaque dourado para o tempo forte (acento) e verde nos demais.
  - No diagrama 3D (`RoadmapScene.vue`): pulsação elástica no nó ativo com GSAP, ondas sonoras de choque (sonar ripples) concêntricas emitidas no ritmo, pulso luminoso dinâmico no trajeto e Floating HUD com mini-pêndulo oscilante, contagem de batidas e botão de parada instantânea.
- **Persistência e Volume:** Volume ajustável com mute e persistência automática em `localStorage` para BPM, compasso, timbre e volume.

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
├── composables/useThreeScene.ts
├── components/RoadmapScene.vue, ExerciseModal.vue, PlayerControls.vue, StreakPanel.vue, MetronomeWidget.vue
├── App.vue, main.ts, router/index.ts
```

## Plano Futuro (Blaze)
- Migrar para plano Blaze (custo zero dentro dos limites)
- Ativar Cloud Storage para upload de vídeos de prática

## Regras de Workflow do Agente (CRITICAL)
- **ATENÇÃO ANTES DE COMMITAR:** Sempre antes de realizar qualquer `git commit` ou criar pull requests, o agente DEVE revisar e atualizar a documentação presente na pasta `/context` e o arquivo `GEMINI.md`. É responsabilidade do agente garantir que a documentação de arquitetura, estados (stores), componentes e regras esteja sempre sincronizada com o código atual antes de persistir as mudanças no repositório.
