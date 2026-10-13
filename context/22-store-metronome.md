# Contexto 22 — Store e Componente: Metrônomo (`metronome.ts` e `MetronomeWidget.vue`)

## Visão Geral
Adiciona suporte nativo a metrônomo acústico/digital para cantores e estudantes de canto, construído diretamente com a Web Audio API (sem dependências externas de áudio ou arquivos MP3 pesados).

## Arquivos
- `src/stores/metronome.ts` — Store Pinia com síntese de áudio, temporizador lookahead e estado reativo.
- `src/components/MetronomeWidget.vue` — Widget de interface do usuário posicionado na sidebar junto ao player.
- `src/types/index.ts` — Tipos `MetronomeSoundType` e `MetronomeConfig`.

## Funcionalidades

### 1. Motor de Áudio Web Audio API (Síntese e Lookahead)
- **Lookahead Scheduler:** Utiliza o algoritmo Chris Wilson ("A Tale of Two Clocks") com checagem a cada 25ms e agendamento de 100ms à frente usando `audioContext.currentTime`. Elimina instabilidades ou drift de temporização causados pelo loop de eventos do navegador.
- **5 Timbres Sintetizados:**
  - `woodblock`: Oscilador triangular com sweep de frequência e filtro bandpass ressonante. Timbres clássico de bloco de madeira, muito nítido sem cansar os ouvidos.
  - `beep`: Oscilador senoidal puro em frequências agudas (1320Hz acento / 880Hz tempo fraco) com decaimento exponencial rápido.
  - `stick`: Rajada de ruído branco processada por filtro highpass + oscilador triangular, simulando o clique seco de baquetas de bateria.
  - `cowbell`: Síntese inspirada na campana da Roland TR-808, combinando dois osciladores de onda quadrada com filtro bandpass.
  - `pop`: Frequência senoidal descendente suave, simulando uma gota d'água percussiva.

### 2. Configurações e Controles
- **BPM:** Faixa de 30 a 260 BPM.
  - Incrementos de ±1 e ±5.
  - Slider contínuo.
  - Rótulo de andamento tradicional italiano (Largo, Larghetto, Adagio, Andante, Moderato, Allegro, Vivace, Presto).
  - Botão **Tap Tempo**: Calcula o tempo médio dos toques do usuário (reseta após 2.5s de inatividade) e ajusta o BPM com preview sonoro instantâneo.
- **Batidas por Compasso (Fórmula de Compasso):**
  - Presets rápidos: 1 (Livre / sem acento), 2/4, 3/4, 4/4, 6/8.
  - Stepper para configurar de 1 a 12 batidas por compasso.
  - A primeira batida (`currentBeat === 1`) quando `beatsPerMeasure > 1` é tocada com maior intensidade e pitch mais alto (acento musical).
- **Volume:** Slider de volume master de 0% a 100% com botão de alternância de mute.
- **Persistência Local:** Salva e recupera automaticamente `bpm`, `beatsPerMeasure`, `soundType` e `volume` em `localStorage`.
- **Atalho de Teclado:** Tecla `M` alterna Play/Pause do metrônomo globalmente.

### 3. Sincronização e Animação no Diagrama (`RoadmapScene.vue`)
- **Pulso Elástico GSAP:** A cada batida registrada (`beatTick`), o nó ativo do roadmap sofre pulsação de escala física no DOM.
- **Ondas Sonoras (Sonar Waves):** Anéis concêntricos se propagam a partir do nó ativo a cada batida, com brilho dourado (#ffe500) nos acentos e azul (#38bdf8) nos tempos fracos.
- **Trajeto Rítmico:** O caminho SVG iluminado pulsa no ritmo enquanto o metrônomo toca.
- **Scene Floating HUD:** Um pill flutuante no topo do cenário 3D exibe agulha oscilante estilo metrônomo tradicional, leitura do BPM e dots de contagem em tempo real, permitindo pausar com um clique diretamente no diagrama.
