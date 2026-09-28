<script setup lang="ts">
import { ref, computed } from 'vue'
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
  <div class="modal-overlay" @click.self="onHide">
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="modal-title">{{ node.title }}</h2>
        <button class="close-modal-btn" @click="onHide">×</button>
      </div>

      <div class="modal-content">
        <div class="modal-time">⏱️ {{ node.time }}</div>
        <div class="modal-progress">{{ completedCount }} / {{ node.exercises.length }} exercícios concluídos</div>
        
        <div class="exercise-list">
          <label 
            v-for="exercise in node.exercises" 
            :key="exercise.id"
            class="exercise-item"
            :class="{ completed: exercise.completed }"
          >
            <input 
              type="checkbox"
              class="native-checkbox"
              :checked="exercise.completed" 
              @change="toggleExercise(exercise.id)" 
            />
            <div class="exercise-info">
              <span class="exercise-name">{{ exercise.name }}</span>
              <div class="exercise-meta">
                <a v-if="exercise.videoUrl" :href="exercise.videoUrl" target="_blank" class="exercise-link" @click.stop>🎬 Ver vídeo</a>
                <span v-if="exercise.videoDuration" class="exercise-duration">{{ formatDuration(exercise.videoDuration) }}</span>
              </div>
            </div>
            <button class="remove-btn" @click.prevent="removeExercise(exercise.id)" title="Remover">×</button>
          </label>
        </div>
        
        <div v-if="totalNodeDuration > 0" class="duration-total">
          📊 Duração total dos vídeos: {{ formatDuration(totalNodeDuration) }}
        </div>
        
        <div class="add-section">
          <h3>➕ Adicionar exercício</h3>
          <div class="add-form">
            <input type="text" v-model="newName" placeholder="Nome do exercício" class="native-input" />
            <input type="text" v-model="newVideoUrl" placeholder="Link do vídeo (opcional)" class="native-input" />
            <div class="duration-inputs">
              <input type="number" v-model="newDurationMin" placeholder="Min" class="native-input input-small" />
              <span>:</span>
              <input type="number" v-model="newDurationSec" placeholder="Seg" class="native-input input-small" />
            </div>
            <button class="native-button" @click="addExercise" :disabled="!newName.trim()">Adicionar</button>
          </div>
        </div>
        
        <div class="ai-section">
          <button 
            class="native-button ai-button"
            @click="analyzeWithAI" 
            :disabled="!aiUsageStore.canCall || aiLoading" 
          >
            {{ aiLoading ? 'Analisando...' : '🤖 Analisar seção com IA' }}
          </button>
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
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-container {
  background: #ffffff;
  border: 4px solid #000;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 3px solid #000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border-radius: 12px 12px 0 0;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #000;
  margin: 0;
}

.close-modal-btn {
  background: transparent;
  border: none;
  color: #000;
  font-size: 1.8rem;
  font-weight: bold;
  cursor: pointer;
  line-height: 1;
}

.close-modal-btn:hover {
  color: #ef4444;
}

.modal-content {
  padding: 24px;
  overflow-y: auto;
  color: #0f172a;
}

.modal-time {
  font-size: 0.9rem;
  color: #475569;
  font-weight: 600;
  margin-bottom: 4px;
}

.modal-progress {
  font-size: 0.85rem;
  color: #16a34a;
  font-weight: 800;
  margin-bottom: 20px;
}

.exercise-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exercise-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #ffffff;
  border: 2px solid #000;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 2px 2px 0 #000;
}

.exercise-item:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 #000;
}

.exercise-item.completed {
  opacity: 0.8;
  background: #f0fdf4;
  border-color: #16a34a;
  box-shadow: 2px 2px 0 #16a34a;
}

.exercise-item.completed .exercise-name {
  text-decoration: line-through;
  color: #475569;
}

.native-checkbox {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  accent-color: #22c55e;
  cursor: pointer;
}

.exercise-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exercise-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: #000;
}

.exercise-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.exercise-link {
  color: #2563eb;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
}

.exercise-link:hover {
  text-decoration: underline;
}

.exercise-duration {
  font-size: 0.75rem;
  color: #475569;
  font-weight: 600;
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  opacity: 0.6;
}

.remove-btn:hover {
  opacity: 1;
}

.duration-total {
  margin-top: 16px;
  font-size: 0.9rem;
  color: #0f172a;
  font-weight: 700;
  background: #f8fafc;
  padding: 10px 14px;
  border-radius: 8px;
  border: 2px solid #000;
}

/* Formulário e Botões Nativos */
.add-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 3px dashed #cbd5e1;
}

.add-section h3 {
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0 0 16px 0;
  color: #000;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.native-input {
  background: #ffffff;
  border: 2px solid #000;
  color: #000;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  outline: none;
  font-family: inherit;
  box-shadow: 2px 2px 0 #000;
}

.native-input:focus {
  border-color: #2563eb;
  box-shadow: 2px 2px 0 #2563eb;
}

.duration-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.input-small {
  width: 80px;
}

.native-button {
  background: #ffe500;
  color: #000;
  border: 2px solid #000;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.1s, background 0.2s;
  box-shadow: 2px 2px 0 #000;
}

.native-button:hover:not(:disabled) {
  background: #ffec33;
}

.native-button:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.native-button:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  border-color: #cbd5e1;
  box-shadow: none;
  cursor: not-allowed;
}

/* AI Section */
.ai-section {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 3px dashed #cbd5e1;
}

.ai-button {
  width: 100%;
  background: #a855f7;
  color: #fff;
}

.ai-button:hover:not(:disabled) {
  background: #b165f8;
}

.ai-usage {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 8px;
  text-align: center;
  font-weight: 600;
}

.ai-usage.warning { color: #eab308; }
.ai-usage.critical, .ai-usage.blocked { color: #ef4444; font-weight: bold; }

.ai-error {
  color: #ef4444;
  margin-top: 8px;
  font-size: 0.85rem;
  text-align: center;
  font-weight: bold;
}

.ai-result {
  margin-top: 16px;
  padding: 16px;
  background: #faf5ff;
  border: 2px solid #9333ea;
  border-radius: 8px;
  box-shadow: 2px 2px 0 #9333ea;
}

.ai-result h4 {
  color: #7e22ce;
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  font-weight: 800;
}

.ai-result p {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #1e1b4b;
  font-weight: 500;
}

.ai-result ul {
  margin: 0;
  padding-left: 20px;
  color: #312e81;
}

.ai-result li {
  margin-bottom: 6px;
  font-size: 0.9rem;
  font-weight: 500;
}
</style>
