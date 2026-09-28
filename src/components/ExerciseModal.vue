<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useRoutineStore } from '@/stores/routine'
import { useAIUsageStore } from '@/stores/aiUsage'
import { analyzeSection } from '@/lib/ai'
import type { AIAnalysis } from '@/types'

const props = defineProps<{
  nodeIndex: number
}>()

const emit = defineEmits<{
  close: []
}>()

const routineStore = useRoutineStore()
const aiUsageStore = useAIUsageStore()

const visible = ref(true)
const newName = ref('')
const newVideoUrl = ref('')
const newDurationMin = ref('')
const newDurationSec = ref('')
const aiAnalysis = ref<AIAnalysis | null>(null)
const aiLoading = ref(false)
const aiError = ref('')

const node = computed(() => routineStore.nodes[props.nodeIndex]!)

const completedCount = computed(() =>
  node.value.exercises.filter(e => e.completed).length
)

const totalNodeDuration = computed(() =>
  node.value.exercises.reduce((sum, e) => sum + (e.videoDuration ?? 0), 0)
)

function toggleExercise(exerciseId: string): void {
  routineStore.toggleExercise(node.value.id, exerciseId)
}

function addExercise(): void {
  if (!newName.value.trim()) return
  const minutes = parseInt(newDurationMin.value) || 0
  const seconds = parseInt(newDurationSec.value) || 0
  const totalSeconds = minutes * 60 + seconds
  
  routineStore.addExercise(
    node.value.id,
    newName.value.trim(),
    newVideoUrl.value.trim() || undefined,
    totalSeconds > 0 ? totalSeconds : undefined,
  )
  
  newName.value = ''
  newVideoUrl.value = ''
  newDurationMin.value = ''
  newDurationSec.value = ''
}

function removeExercise(exerciseId: string): void {
  routineStore.removeExercise(node.value.id, exerciseId)
}

async function analyzeWithAI(): Promise<void> {
  if (!aiUsageStore.canCall) {
    if (aiUsageStore.isBlocked) {
      aiError.value = 'Limite diário atingido. Tente amanhã.'
    } else {
      aiError.value = 'Muitas chamadas por minuto. Aguarde.'
    }
    return
  }
  
  aiLoading.value = true
  aiError.value = ''
  aiUsageStore.recordCall()
  
  try {
    aiAnalysis.value = await analyzeSection(node.value)
  } catch (error: any) {
    aiError.value = error.message || 'Erro ao analisar.'
  } finally {
    aiLoading.value = false
  }
}

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function onHide(): void {
  emit('close')
}
</script>

<template>
  <Dialog v-model:visible="visible" modal :header="node.title" @hide="onHide">
    <div class="modal-time">⏱️ {{ node.time }}</div>
    <div class="modal-progress">{{ completedCount }} / {{ node.exercises.length }} exercícios concluídos</div>
    
    <div class="exercise-list">
      <div 
        v-for="exercise in node.exercises" 
        :key="exercise.id"
        class="exercise-item"
        :class="{ completed: exercise.completed }"
      >
        <Checkbox 
          :modelValue="exercise.completed" 
          :binary="true" 
          @update:modelValue="toggleExercise(exercise.id)" 
        />
        <div class="exercise-info">
          <span class="exercise-name">{{ exercise.name }}</span>
          <a v-if="exercise.videoUrl" :href="exercise.videoUrl" target="_blank" class="exercise-link">🎬 Ver vídeo</a>
          <span v-if="exercise.videoDuration" class="exercise-duration">{{ formatDuration(exercise.videoDuration) }}</span>
        </div>
        <button class="remove-btn" @click="removeExercise(exercise.id)" title="Remover">×</button>
      </div>
    </div>
    
    <div v-if="totalNodeDuration > 0" class="duration-total">
      📊 Duração total dos vídeos: {{ formatDuration(totalNodeDuration) }}
    </div>
    
    <div class="add-section">
      <h3>➕ Adicionar exercício</h3>
      <div class="add-form">
        <InputText v-model="newName" placeholder="Nome do exercício" />
        <InputText v-model="newVideoUrl" placeholder="Link do vídeo (opcional)" />
        <div class="duration-inputs">
          <InputText v-model="newDurationMin" placeholder="Min" class="input-small" />
          <span>:</span>
          <InputText v-model="newDurationSec" placeholder="Seg" class="input-small" />
        </div>
        <Button label="Adicionar" @click="addExercise" :disabled="!newName.trim()" />
      </div>
    </div>
    
    <div class="ai-section">
      <Button 
        label="🤖 Analisar seção com IA" 
        @click="analyzeWithAI" 
        :disabled="!aiUsageStore.canCall || aiLoading" 
        :loading="aiLoading" 
      />
      <div class="ai-usage" :class="{ warning: aiUsageStore.isWarning, critical: aiUsageStore.isCritical, blocked: aiUsageStore.isBlocked }">
        {{ aiUsageStore.requestCount }} / {{ aiUsageStore.DAILY_LIMIT }} chamadas hoje ({{ aiUsageStore.usagePercent }}%)
      </div>
      <div v-if="aiError" class="ai-error">⚠️ {{ aiError }}</div>
      
      <div v-if="aiAnalysis" class="ai-result">
        <h4>📝 Análise da IA</h4>
        <p>{{ aiAnalysis.feedback }}</p>
        <ul>
          <li v-for="(s, i) in aiAnalysis.suggestions" :key="i">{{ s }}</li>
        </ul>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
/* Overlay/Mask */
:deep(.p-dialog-mask) {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

/* Container do Dialog */
:deep(.p-dialog) {
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

:deep(.p-dialog-header) {
  padding: 20px 24px 12px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffe500;
  border-bottom: 1px solid rgba(255, 229, 0, 0.1);
}

:deep(.p-dialog-content) {
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
.ai-usage.blocked { color: #ef4444; }

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
</style>
