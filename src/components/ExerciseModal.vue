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
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-container {
  background: #11111a;
  border: 2px solid #333;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 2px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffe500;
  margin: 0;
}

.close-modal-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

.close-modal-btn:hover {
  color: #fff;
}

.modal-content {
  padding: 20px;
  overflow-y: auto;
  color: #e2e8f0;
}

.modal-time {
  font-size: 0.9rem;
  color: #a0aec0;
  margin-bottom: 4px;
}

.modal-progress {
  font-size: 0.85rem;
  color: #22c55e;
  font-weight: 600;
  margin-bottom: 16px;
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
  background: #1a1a24;
  border: 2px solid #2a2a35;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.exercise-item:hover {
  border-color: #444;
}

.exercise-item.completed {
  opacity: 0.6;
  background: #15151d;
  border-color: #22c55e40;
}

.exercise-item.completed .exercise-name {
  text-decoration: line-through;
  color: #a0aec0;
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
  font-weight: 500;
  font-size: 0.95rem;
}

.exercise-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.exercise-link {
  color: #3b82f6;
  font-size: 0.8rem;
  text-decoration: none;
}

.exercise-link:hover {
  text-decoration: underline;
}

.exercise-duration {
  font-size: 0.75rem;
  color: #718096;
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.5;
}

.remove-btn:hover {
  opacity: 1;
}

.duration-total {
  margin-top: 16px;
  font-size: 0.9rem;
  color: #cbd5e1;
  background: #1a1a24;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #2a2a35;
}

/* Formulário e Botões Nativos (estilo roadmap.sh: clean e bold) */
.add-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px dashed #333;
}

.add-section h3 {
  font-size: 1rem;
  margin: 0 0 12px 0;
  color: #e2e8f0;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.native-input {
  background: #0f0f15;
  border: 2px solid #333;
  color: #fff;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  outline: none;
  font-family: inherit;
}

.native-input:focus {
  border-color: #ffe500;
}

.duration-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-small {
  width: 80px;
}

.native-button {
  background: #ffe500;
  color: #000;
  border: 2px solid #e5ce00;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.1s, background 0.2s;
}

.native-button:hover:not(:disabled) {
  background: #ffec33;
}

.native-button:active:not(:disabled) {
  transform: scale(0.98);
}

.native-button:disabled {
  background: #555;
  border-color: #444;
  color: #888;
  cursor: not-allowed;
}

/* AI Section */
.ai-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px dashed #333;
}

.ai-button {
  width: 100%;
  background: #8b5cf6;
  border-color: #7c3aed;
  color: #fff;
}

.ai-button:hover:not(:disabled) {
  background: #9f7aea;
}

.ai-usage {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 8px;
  text-align: center;
}

.ai-usage.warning { color: #eab308; }
.ai-usage.critical, .ai-usage.blocked { color: #ef4444; font-weight: bold; }

.ai-error {
  color: #ef4444;
  margin-top: 8px;
  font-size: 0.85rem;
  text-align: center;
}

.ai-result {
  margin-top: 16px;
  padding: 16px;
  background: #1a1525;
  border: 2px solid #5b21b6;
  border-radius: 8px;
}

.ai-result h4 {
  color: #c4b5fd;
  margin: 0 0 12px 0;
  font-size: 1rem;
}

.ai-result p {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
  line-height: 1.4;
}

.ai-result ul {
  margin: 0;
  padding-left: 20px;
  color: #e2e8f0;
}

.ai-result li {
  margin-bottom: 6px;
  font-size: 0.9rem;
}
</style>
