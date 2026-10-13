<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoutineStore } from '@/stores/routine'
import { useAIUsageStore } from '@/stores/aiUsage'
import { analyzeSection } from '@/lib/ai'
import RichTextEditor from './RichTextEditor.vue'
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
const newMediaType = ref<'video' | 'reference'>('video')
const newMediaUrl = ref('')
const newMediaTitle = ref('')
const newDurationMin = ref('')
const newDurationSec = ref('')
const newNotes = ref('')

const editingId = ref<string | null>(null)
const editName = ref('')
const editNotes = ref('')
const editMedia = ref<import('@/types').MediaItem[]>([])
const aiAnalysis = ref<AIAnalysis | null>(null)
const aiLoading = ref(false)
const aiError = ref('')

const node = computed(() => routineStore.nodes[props.nodeIndex]!)

const completedCount = computed(() =>
  node.value.exercises.filter(e => e.completed).length
)

const totalNodeDuration = computed(() =>
  node.value.exercises.reduce((sum, e) => {
    let exSum = 0
    if (e.media) exSum += e.media.reduce((a, b) => a + (b.duration || 0), 0)
    else if (e.videos) exSum += e.videos.reduce((a, b) => a + (b.duration || 0), 0)
    else if (e.videoDuration) exSum += e.videoDuration
    return sum + exSum
  }, 0)
)

function toggleExercise(exerciseId: string): void {
  routineStore.toggleExercise(node.value.id, exerciseId)
}

function addExercise(): void {
  if (!newName.value.trim()) return
  const minutes = parseInt(newDurationMin.value) || 0
  const seconds = parseInt(newDurationSec.value) || 0
  const totalSeconds = minutes * 60 + seconds
  
  const mediaItems: import('@/types').MediaItem[] = []
  if (newMediaUrl.value.trim()) {
    mediaItems.push({
      id: `media-${Date.now()}`,
      type: newMediaType.value,
      url: newMediaUrl.value.trim(),
      title: newMediaTitle.value.trim() || undefined,
      duration: totalSeconds > 0 ? totalSeconds : undefined
    })
  }
  
  routineStore.addExercise(
    node.value.id,
    newName.value.trim(),
    mediaItems,
    newNotes.value
  )
  
  newName.value = ''
  newNotes.value = ''
  newMediaUrl.value = ''
  newMediaTitle.value = ''
  newDurationMin.value = ''
  newDurationSec.value = ''
  newMediaType.value = 'video'
}

function startEdit(exercise: any) {
  editingId.value = exercise.id
  editName.value = exercise.name
  editNotes.value = exercise.notes || ''
  editMedia.value = JSON.parse(JSON.stringify(exercise.media || []))
  
  // Migrate old videos if present in edit mode for simplicity
  if (!editMedia.value.length && exercise.videos?.length) {
    editMedia.value = exercise.videos.map((v: any) => ({
      id: `mig-${Date.now()}`, type: 'video', url: v.url, duration: v.duration
    }))
  }
}

function saveEdit() {
  if (!editingId.value || !editName.value.trim()) return
  routineStore.updateExercise(node.value.id, editingId.value, {
    name: editName.value.trim(),
    notes: editNotes.value,
    media: editMedia.value.filter(m => m.url.trim() !== '')
  })
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}

function removeExercise(exerciseId: string): void {
  routineStore.removeExercise(node.value.id, exerciseId)
}

function moveExerciseUp(index: number): void {
  routineStore.moveExerciseUp(node.value.id, index)
}

function moveExerciseDown(index: number): void {
  routineStore.moveExerciseDown(node.value.id, index)
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
          <template v-for="(exercise, index) in node.exercises" :key="exercise.id">
            <!-- Modo de Visualização -->
            <label 
              v-if="editingId !== exercise.id"
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
                <div class="exercise-meta" v-if="(exercise.media && exercise.media.length) || (exercise.videos && exercise.videos.length)">
                  <template v-if="exercise.media && exercise.media.length">
                    <template v-for="m in exercise.media" :key="m.id">
                      <a :href="m.url" target="_blank" class="exercise-link" @click.stop>
                        {{ m.type === 'video' ? '🎬' : '📄' }} {{ m.title || (m.type === 'video' ? 'Ver vídeo' : 'Ver referência') }}
                      </a>
                      <span v-if="m.type === 'video' && m.duration" class="exercise-duration">{{ formatDuration(m.duration) }}</span>
                    </template>
                  </template>
                  <template v-else-if="exercise.videos && exercise.videos.length">
                    <a :href="exercise.videos?.[0]?.url" target="_blank" class="exercise-link" @click.stop>🎬 Ver vídeo</a>
                    <span v-if="exercise.videos?.[0]?.duration" class="exercise-duration">{{ formatDuration(exercise.videos[0].duration!) }}</span>
                  </template>
                </div>
                <div v-if="exercise.notes" class="exercise-notes-view" v-html="exercise.notes"></div>
              </div>
              <div class="exercise-actions">
                <button class="icon-btn reorder-btn" :disabled="index === 0" @click.prevent="moveExerciseUp(index)" title="Mover para cima">▲</button>
                <button class="icon-btn reorder-btn" :disabled="index === node.exercises.length - 1" @click.prevent="moveExerciseDown(index)" title="Mover para baixo">▼</button>
                <button class="icon-btn" @click.prevent="startEdit(exercise)" title="Editar">✏️</button>
                <button class="remove-btn" @click.prevent="removeExercise(exercise.id)" title="Remover">×</button>
              </div>
            </label>

            <!-- Modo de Edição -->
            <div v-else class="exercise-item edit-mode">
              <div class="edit-form">
                <input type="text" v-model="editName" placeholder="Nome do exercício" class="native-input" />
                
                <div class="edit-media-list">
                  <div v-for="(m, i) in editMedia" :key="m.id" class="edit-media-item">
                    <select v-model="m.type" class="native-select">
                      <option value="video">Vídeo</option>
                      <option value="reference">Referência</option>
                    </select>
                    <input type="text" v-model="m.title" placeholder="Título (Opcional)" class="native-input flex-1" />
                    <input type="text" v-model="m.url" placeholder="URL" class="native-input flex-2" />
                    <button class="remove-btn" @click="editMedia.splice(i, 1)">×</button>
                  </div>
                  <button class="native-button small outline" @click="editMedia.push({ id: `new-${Date.now()}`, type: 'video', url: '' })">
                    + Adicionar Mídia
                  </button>
                </div>

                <div class="edit-notes">
                  <label>Notas:</label>
                  <RichTextEditor v-model="editNotes" />
                </div>
                
                <div class="edit-actions">
                  <button class="native-button" @click="saveEdit">Salvar</button>
                  <button class="native-button cancel" @click="cancelEdit">Cancelar</button>
                </div>
              </div>
            </div>
          </template>
        </div>
        
        <div v-if="totalNodeDuration > 0" class="duration-total">
          📊 Duração total dos vídeos: {{ formatDuration(totalNodeDuration) }}
        </div>
        
        <div class="add-section">
          <h3>➕ Adicionar exercício</h3>
          <div class="add-form">
            <input type="text" v-model="newName" placeholder="Nome do exercício" class="native-input" />
            
            <div class="media-inputs">
              <select v-model="newMediaType" class="native-select">
                <option value="video">Vídeo</option>
                <option value="reference">Referência</option>
              </select>
              <input type="text" v-model="newMediaUrl" placeholder="URL da mídia (opcional)" class="native-input flex-1" />
            </div>
            
            <div class="media-details" v-if="newMediaUrl.trim()">
              <input type="text" v-model="newMediaTitle" placeholder="Título da mídia (opcional)" class="native-input flex-1" />
              <div class="duration-inputs" v-if="newMediaType === 'video'">
                <input type="number" v-model="newDurationMin" placeholder="Min" class="native-input input-small" />
                <span>:</span>
                <input type="number" v-model="newDurationSec" placeholder="Seg" class="native-input input-small" />
              </div>
            </div>

            <div class="notes-input">
              <label>Notas adicionais:</label>
              <RichTextEditor v-model="newNotes" />
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

.exercise-notes-view :deep(ul) { list-style-type: disc; padding-left: 20px; margin: 0 0 0.5em 0; }
.exercise-notes-view :deep(ol) { list-style-type: decimal; padding-left: 20px; margin: 0 0 0.5em 0; }
.exercise-notes-view :deep(li) { margin-bottom: 0.2em; }
.exercise-notes-view :deep(h1) { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; }
.exercise-notes-view :deep(h2) { font-size: 1.3em; font-weight: bold; margin: 0.5em 0; }
.exercise-notes-view :deep(h3) { font-size: 1.1em; font-weight: bold; margin: 0.5em 0; }
.exercise-notes-view :deep(strong) { font-weight: 800; }
</style>

<style scoped>
.exercise-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  opacity: 0.7;
  padding: 4px;
}
.icon-btn:hover {
  opacity: 1;
}
.icon-btn.reorder-btn {
  font-size: 0.75rem;
  padding: 2px 6px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #f8fafc;
}
.icon-btn.reorder-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.exercise-notes-view {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border-left: 3px solid #cbd5e1;
  font-size: 0.9rem;
  color: #334155;
  border-radius: 0 4px 4px 0;
}
.exercise-notes-view :deep(p) {
  margin: 0 0 0.5em 0;
}
.exercise-notes-view :deep(p:last-child) {
  margin-bottom: 0;
}
.edit-mode {
  cursor: default;
  background: #f8fafc;
  border-color: #3b82f6;
  box-shadow: 2px 2px 0 #3b82f6;
}
.edit-mode:hover {
  transform: none;
  box-shadow: 2px 2px 0 #3b82f6;
}
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}
.native-button.cancel {
  background: #e2e8f0;
  border-color: #94a3b8;
  color: #475569;
}
.native-button.cancel:hover {
  background: #cbd5e1;
}
.native-select {
  background: #ffffff;
  border: 2px solid #000;
  color: #000;
  padding: 10px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}
.media-inputs {
  display: flex;
  gap: 8px;
}
.media-details {
  display: flex;
  gap: 8px;
  align-items: center;
}
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.edit-media-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fff;
  padding: 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
}
.edit-media-item {
  display: flex;
  gap: 8px;
  align-items: center;
}
.small {
  padding: 6px 12px;
  font-size: 0.85rem;
}
.outline {
  background: transparent;
  border: 2px dashed #94a3b8;
  color: #475569;
  box-shadow: none;
}
.outline:hover {
  background: #f1f5f9;
  border-color: #64748b;
  color: #0f172a;
}
.notes-input label, .edit-notes label {
  display: block;
  font-size: 0.9rem;
  font-weight: bold;
  color: #475569;
  margin-bottom: 4px;
}
</style>
