# Contexto 22 — Store e Componente: Metrônomo (`metronome.ts` e `MetronomeWidget.vue`)

## Visão Geral
Adiciona suporte nativo a metrônomo acústico/digital para cantores e estudantes de canto, construído diretamente com a Web Audio API (sem dependências externas de áudio ou arquivos MP3 pesados).

## Arquivos
- `src/stores/metronome.ts` — Store Pinia com síntese de áudio, temporizador de prática, agendamento lookahead e sincronização.
- `src/components/MetronomeWidget.vue` — Widget unificado em 1 único card (Metrônomo + Temporizador com botão de controle mestre) posicionado acima do player.
- `src/composables/useVoiceCoach.ts` — Composable para avisos de voz sintetizada ("Iniciando" e "Finalizado").
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

### 2. Temporizador de Prática (Timer Integrado)
- **Configuração de Tempo X:** Permite ao cantor definir a duração exata de treino para o metrônomo tocar antes de parar automaticamente.
- **Presets Rápidos:** Botões para 30s, 1m (60s), 2m (120s), 3m (180s), 5m (300s) e modo Livre (∞ / 0s).
- **Ajustes Finos:** Botões de incremento e decremento de ±15s para customização ágil.
- **Display e Progresso:** Formatação `MM:SS` com barra de progresso visual de preenchimento suave.
- **Sincronização:** Opção `⏱️ Sinc` para ligar/desligar o metrônomo automaticamente junto com o timer ou rodar apenas o timer silencioso.
- **Conclusão e Avanço:** Ao zerar o temporizador, emite callbacks que concluem o exercício ativo e acionam o auto-avanço na trilha de prática.

### 3. Voice Coach (Voz Sintetizada Web Speech API)
- **Avisos Vocais em Português:**
  - Fala `"Iniciando"` ao dar play no temporizador, metrônomo ou vídeo.
  - Fala `"Finalizado"` quando o temporizador atinge 00:00 ou o vídeo da lição termina.
- **Controle pelo Usuário:** Chip integrado `🎙️ Voz On / 🔇 Voz Off` para ativar ou silenciar a voz a qualquer momento, persistido em `localStorage`.

### 4. Configurações e Controles
- **BPM:** Faixa de 30 a 260 BPM.
  - Incrementos de ±5 e slider contínuo.
  - Rótulo de andamento tradicional italiano (Largo, Larghetto, Adagio, Andante, Moderato, Allegro, Vivace, Presto).
  - Botão **Tap Tempo**: Calcula o tempo médio dos toques do usuário (reseta após 2.5s de inatividade) e ajusta o BPM com preview sonoro instantâneo.
- **Batidas por Compasso (Fórmula de Compasso):**
  - Presets rápidos: 1 (Livre / sem acento), 2/4, 3/4, 4/4, 6/8.
  - A primeira batida (`currentBeat === 1`) quando `beatsPerMeasure > 1` é tocada com maior intensidade e pitch mais alto (acento musical).
- **Volume:** Slider de volume master de 0% a 100% com botão de alternância de mute.
- **Persistência Local:** Salva e recupera automaticamente `bpm`, `beatsPerMeasure`, `soundType`, `volume`, `timerDuration` e `syncWithMetronome` em `localStorage`.
- **Atalhos de Teclado:** Tecla `M` alterna Play/Pause do metrônomo e tecla `T` alterna o temporizador globalmente.

### 5. Sincronização e Animação no Diagrama (`RoadmapScene.vue`)
- **Pulso Elástico GSAP:** A cada batida registrada (`beatTick`), o nó ativo do roadmap sofre pulsação de escala física no DOM.
- **Ondas Sonoras (Sonar Waves):** Anéis concêntricos se propagam a partir do nó ativo a cada batida, com brilho dourado (#ffe500) nos acentos e azul (#38bdf8) nos tempos fracos.
- **Trajeto Rítmico:** O caminho SVG iluminado pulsa no ritmo enquanto o metrônomo toca.
- **Scene Floating HUD:** Um pill flutuante no topo do cenário 3D exibe agulha oscilante estilo metrônomo tradicional, leitura do BPM e dots de contagem em tempo real, permitindo pausar com um clique diretamente no diagrama.
