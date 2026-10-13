# Contexto 11 — Componente: RoadmapScene (Canvas 3D)

> Crie o arquivo `src/components/RoadmapScene.vue`.

## Arquivo: `src/components/RoadmapScene.vue`

## Pré-requisitos
- `src/composables/useThreeScene.ts` criado (contexto 10)
- `src/stores/player.ts` criado (contexto 07)
- `src/stores/routine.ts` criado (contexto 06)

## Propósito
Cena interativa simulando espaço 3D usando GSAP, SVG Bezier paths e nós DOM estilizados com glassmorphism. O usuário pode arrastar para explorar o mapa, clicar nos nós para navegar e ver a lista lateral contextual de exercícios.

### Animações do Metrônomo na Cena
Quando o metrônomo está ativo (`metronomeStore.isPlaying`):
- **Pulso Elástico no Nó Ativo:** O nó da seção ativa sofre pulso físico via `gsap.fromTo(activeEl, { scale: isAccent ? 1.25 : 1.16 }, ...)`.
- **Ondas de Choque (Sonar Ripples):** Ondas concêntricas expandem do centro do nó ativo a cada batida, com anel dourado forte no primeiro tempo (acento) e azul-ciano/esmeralda nas demais batidas.
- **Pulso no Trajeto SVG:** A linha conectora brilhante (`.glow-line`) pulsa ritmicamente em sincronia com o andamento.
- **Floating HUD de Cena:** Painel flutuante no canto superior com agulha de pêndulo oscilante, valor de BPM e andamento italiano, visualizador de batidas e botão de parada instantânea.
