# Contexto: Trilha de Prática de Canto — App 3D Interativo

Este documento registra o escopo e contexto para o aplicativo "Trilha de Prática de Canto", um app de rotina de prática vocal com roadmap 3D animado.

## Objetivo do Projeto
App de rotina interativa para guiar a prática diária de canto. O usuário navega entre seções (nós do roadmap) num ambiente 3D, marca exercícios como concluídos, adiciona novos exercícios com links de vídeo, recebe análise personalizada via IA generativa (Gemini), e rastreia sua ofensiva (streak) de dias consecutivos.

## Stack Tecnológico
- **Framework:** Vue 3 (Composition API, `<script setup>`)
- **Linguagem:** TypeScript (~6.0)
- **Build:** Vite (^8.2)
- **3D:** Three.js raw (^0.186) — cena de background com nós animados
- **UI Components:** PrimeVue 5 Unstyled — Dialog, Button, Checkbox, InputText
- **Estado:** Pinia (^4.0) — stores: routine, player, streak, aiUsage
- **Backend:** Firebase (plano Spark) — apenas AI Logic
- **IA:** Firebase AI Logic + Gemini 2.5 Flash — análise de seções
- **Persistência:** localStorage (Firestore planejado para futuro)

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

### Cena 3D (Three.js)
- Nós flutuantes em zigzag com animação (flutuação, rotação suave)
- Caminho luminoso (tube geometry) conectando os nós
- Partículas de fundo (estrelas)
- Câmera segue o nó ativo com lerp suave
- Nó ativo: brilho pulsante amarelo. Nó completado: verde. Inativo: opaco

### Modal de Exercícios (PrimeVue Dialog)
- Lista de exercícios com Checkbox de conclusão
- Adicionar exercício: nome + link de vídeo + duração (min:seg)
- Remover exercício (botão ×)
- Duração total calculada dos vídeos vinculados
- Botão "Analisar com IA" → feedback do Gemini

### Player de Rotina
- Botões: ⏮ Anterior | ▶/⏸ Play/Pause | ⏭ Próximo
- Auto-advance: avança automaticamente 1.5s após completar seção (quando ativado)
- Barra de progresso (seções completadas)
- Botão "Concluir Sessão" quando tudo está completo

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
- Sem Cloud Storage (vídeos por URL externa)

## Design e Estilização
- Tema escuro (#080816) com glassmorphism
- Amarelo (#ffe500) para nós ativos e acentos
- Verde (#22c55e) para completados e streak
- Roxo (#8b5cf6) para IA
- PrimeVue totalmente unstyled — CSS customizado
- Responsivo (mobile-first)

## Estrutura de Arquivos
```
src/
├── lib/firebase.ts, ai.ts
├── types/index.ts
├── stores/routine.ts, player.ts, streak.ts, aiUsage.ts
├── composables/useThreeScene.ts
├── components/RoadmapScene.vue, ExerciseModal.vue, PlayerControls.vue, StreakPanel.vue
├── App.vue, main.ts, router/index.ts
```

## Plano Futuro (Blaze)
- Migrar para plano Blaze (custo zero dentro dos limites)
- Ativar Cloud Storage para upload de vídeos de prática
- Adicionar Firestore para persistência e sync entre dispositivos
- Auth para login do usuário
