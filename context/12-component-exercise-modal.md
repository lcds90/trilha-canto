# Contexto 12 — Componente: ExerciseModal (Modal de Exercícios)

> Crie o arquivo `src/components/ExerciseModal.vue` usando PrimeVue Dialog (unstyled).

## Arquivo: `src/components/ExerciseModal.vue`

## Pré-requisitos
- `src/stores/routine.ts` (contexto 06)
- `src/stores/aiUsage.ts` (contexto 09)
- `src/lib/ai.ts` (contexto 05)
- PrimeVue configurado como unstyled no main.ts (contexto 16)

## PrimeVue Components Usados

```typescript
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
```

## Props e Emits

```typescript
const props = defineProps<{
  nodeIndex: number      // Índice do nó no array routineStore.nodes
}>()

const emit = defineEmits<{
  close: []              // Emitido quando o modal fecha
}>()
```

## State Interno

```typescript
const visible = ref(true)                          // Controla visibilidade do Dialog
const newName = ref('')                            // Input: nome do novo exercício
const newVideoUrl = ref('')                        // Input: URL do vídeo (opcional)
const newDurationMin = ref('')                     // Input: minutos da duração
const newDurationSec = ref('')                     // Input: segundos da duração
const aiAnalysis = ref<AIAnalysis | null>(null)    // Resultado da análise IA
const aiLoading = ref(false)                       // Flag de loading da IA
const aiError = ref('')                            // Mensagem de erro da IA
```

## Computeds

```typescript
const node = computed(() => routineStore.nodes[props.nodeIndex]!)

const completedCount = computed(() =>
  node.value.exercises.filter(e => e.completed).length
)

const totalNodeDuration = computed(() =>
  node.value.exercises.reduce((sum, e) => sum + (e.videoDuration ?? 0), 0)
)
```

## Funções

```typescript
function toggleExercise(exerciseId: string): void
  // routineStore.toggleExercise(node.value.id, exerciseId)

function addExercise(): void
  // 1. Se newName.value.trim() vazio → return
  // 2. const minutes = parseInt(newDurationMin.value) || 0
  // 3. const seconds = parseInt(newDurationSec.value) || 0
  // 4. const totalSeconds = minutes * 60 + seconds
  // 5. routineStore.addExercise(
  //      node.value.id,
  //      newName.value.trim(),
  //      newVideoUrl.value.trim() || undefined,
  //      totalSeconds > 0 ? totalSeconds : undefined,
  //    )
  // 6. Limpa todos os campos de input

function removeExercise(exerciseId: string): void
  // routineStore.removeExercise(node.value.id, exerciseId)

async function analyzeWithAI(): Promise<void>
  // 1. Se !aiUsageStore.canCall:
  //    - Se isBlocked → aiError = 'Limite diário atingido. Tente amanhã.'
  //    - Senão → aiError = 'Muitas chamadas por minuto. Aguarde.'
  //    - return
  // 2. aiLoading = true, aiError = ''
  // 3. aiUsageStore.recordCall()
  // 4. try: aiAnalysis.value = await analyzeSection(node.value)
  // 5. catch: aiError = error.message || 'Erro ao analisar.'
  // 6. finally: aiLoading = false

function formatDuration(seconds: number): string
  // const min = Math.floor(seconds / 60)
  // const sec = seconds % 60
  // return `${min}:${sec.toString().padStart(2, '0')}`

function onHide(): void
  // emit('close')
```

## Template — Árvore de Elementos

```
Dialog (v-model:visible="visible", modal, :header="node.title", @hide="onHide")
│
├── div.modal-time
│   → "⏱️ {{ node.time }}"
│
├── div.modal-progress
│   → "{{ completedCount }} / {{ node.exercises.length }} exercícios concluídos"
│
├── div.exercise-list
│   └── div.exercise-item (v-for="exercise in node.exercises" :key="exercise.id")
│       [:class="{ completed: exercise.completed }"]
│       │
│       ├── Checkbox
│       │   :modelValue="exercise.completed"
│       │   :binary="true"
│       │   @update:modelValue="toggleExercise(exercise.id)"
│       │
│       ├── div.exercise-info
│       │   ├── span.exercise-name → "{{ exercise.name }}"
│       │   ├── a.exercise-link (v-if="exercise.videoUrl")
│       │   │   :href="exercise.videoUrl" target="_blank"
│       │   │   → "🎬 Ver vídeo"
│       │   └── span.exercise-duration (v-if="exercise.videoDuration")
│       │       → "{{ formatDuration(exercise.videoDuration) }}"
│       │
│       └── button.remove-btn (@click="removeExercise(exercise.id)")
│           title="Remover" → "×"
│
├── div.duration-total (v-if="totalNodeDuration > 0")
│   → "📊 Duração total dos vídeos: {{ formatDuration(totalNodeDuration) }}"
│
├── div.add-section
│   ├── h3 → "➕ Adicionar exercício"
│   └── div.add-form
│       ├── InputText v-model="newName" placeholder="Nome do exercício"
│       ├── InputText v-model="newVideoUrl" placeholder="Link do vídeo (opcional)"
│       ├── div.duration-inputs
│       │   ├── InputText v-model="newDurationMin" placeholder="Min" (class="input-small")
│       │   ├── span → ":"
│       │   └── InputText v-model="newDurationSec" placeholder="Seg" (class="input-small")
│       └── Button label="Adicionar" @click="addExercise" :disabled="!newName.trim()"
│
└── div.ai-section
    ├── Button
    │   label="🤖 Analisar seção com IA"
    │   @click="analyzeWithAI"
    │   :disabled="!aiUsageStore.canCall || aiLoading"
    │   :loading="aiLoading"
    │
    ├── div.ai-usage
    │   → "{{ aiUsageStore.requestCount }} / {{ aiUsageStore.DAILY_LIMIT }} chamadas hoje ({{ aiUsageStore.usagePercent }}%)"
    │   [:class com cor baseada em isWarning/isCritical/isBlocked]
    │
    ├── div.ai-error (v-if="aiError")
    │   → "⚠️ {{ aiError }}"
    │
    └── div.ai-result (v-if="aiAnalysis")
        ├── h4 → "📝 Análise da IA"
        ├── p → "{{ aiAnalysis.feedback }}"
        └── ul
            └── li (v-for="(s, i) in aiAnalysis.suggestions" :key="i")
                → "{{ s }}"
```

## CSS do Modal (PrimeVue Unstyled)

Como PrimeVue está em modo `unstyled`, estilize usando as classes padrão do PrimeVue:

```css
/* Overlay/Mask */
.p-dialog-mask {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

/* Container do Dialog */
.p-dialog {
  background: rgba(20, 20, 45, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 229, 0, 0.2);
  border-radius: 20px;
  color: #e2e8f0;
  width: 90vw;
  max-width: 560px;
  max-height: 85vh;
  overflow-y: auto;
}

.p-dialog-header {
  padding: 20px 24px 12px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffe500;
  border-bottom: 1px solid rgba(255, 229, 0, 0.1);
}

.p-dialog-content {
  padding: 16px 24px 24px;
}

/* Exercise items */
.exercise-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 16px 0;
}

.exercise-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(30, 30, 60, 0.6);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s;
}

.exercise-item.completed {
  opacity: 0.6;
  text-decoration: line-through;
}

.exercise-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exercise-link {
  color: #3b82f6;
  font-size: 0.8rem;
  text-decoration: none;
}

.exercise-duration {
  font-size: 0.75rem;
  color: #94a3b8;
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.remove-btn:hover {
  opacity: 1;
}

/* Add section */
.add-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.duration-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.duration-inputs span {
  color: #94a3b8;
  font-size: 1.2rem;
}

.input-small {
  width: 80px !important;
}

/* AI section */
.ai-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.ai-usage {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 8px;
}

.ai-usage.warning { color: #eab308; }
.ai-usage.critical { color: #ef4444; }

.ai-error {
  color: #ef4444;
  margin-top: 8px;
  font-size: 0.85rem;
}

.ai-result {
  margin-top: 16px;
  padding: 16px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
}

.ai-result h4 {
  color: #a78bfa;
  margin-bottom: 8px;
}

.ai-result ul {
  margin-top: 8px;
  padding-left: 20px;
}

.ai-result li {
  margin: 4px 0;
  font-size: 0.9rem;
}
```
