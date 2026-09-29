<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { watch, onBeforeUnmount } from 'vue'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [StarterKit],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => props.modelValue, (value) => {
  const isSame = editor.value?.getHTML() === value
  if (isSame) {
    return
  }
  editor.value?.commands.setContent(value || '')
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="rich-text-editor" v-if="editor">
    <div class="toolbar">
      <button
        type="button"
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
        title="Negrito"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
        title="Itálico"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ 'is-active': editor.isActive('strike') }"
        title="Tachado"
      >
        <del>S</del>
      </button>
      <span class="divider">|</span>
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
        title="Título 1"
      >
        H1
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
        title="Título 2"
      >
        H2
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
        title="Título 3"
      >
        H3
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'is-active': editor.isActive('bulletList') }"
        title="Lista"
      >
        • Lista
      </button>
    </div>
    <editor-content :editor="editor" class="editor-content" />
  </div>
</template>

<style scoped>
.rich-text-editor {
  border: 2px solid #000;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  box-shadow: 2px 2px 0 #000;
}

.toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #f8fafc;
  border-bottom: 2px solid #000;
  flex-wrap: wrap;
}

.toolbar button {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #0f172a;
  transition: all 0.2s;
}

.toolbar button:hover {
  background: #e2e8f0;
}

.toolbar button.is-active {
  background: #cbd5e1;
  font-weight: bold;
  border-color: #94a3b8;
}

.divider {
  color: #cbd5e1;
  margin: 0 4px;
  align-self: center;
}

.editor-content {
  padding: 12px;
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
  color: #0f172a;
  cursor: default;
  display: flex;
  flex-direction: column;
}

:deep(.ProseMirror) {
  outline: none;
  font-family: inherit;
  color: #0f172a;
  flex: 1;
  min-height: 100%;
}

:deep(.ProseMirror p) {
  margin: 0 0 0.5em 0;
}
:deep(.ProseMirror p:last-child) {
  margin-bottom: 0;
}

:deep(.ProseMirror ul) {
  list-style-type: disc;
  padding-left: 20px;
  margin: 0 0 0.5em 0;
}
:deep(.ProseMirror ol) {
  list-style-type: decimal;
  padding-left: 20px;
  margin: 0 0 0.5em 0;
}
:deep(.ProseMirror li) {
  margin-bottom: 0.2em;
}

:deep(.ProseMirror h1) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.5em 0;
}
:deep(.ProseMirror h2) {
  font-size: 1.3em;
  font-weight: bold;
  margin: 0.5em 0;
}
:deep(.ProseMirror h3) {
  font-size: 1.1em;
  font-weight: bold;
  margin: 0.5em 0;
}
:deep(.ProseMirror strong) {
  font-weight: 800;
}
</style>
