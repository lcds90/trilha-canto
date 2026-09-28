# Contexto 02 — Configuração do Projeto

> Crie/atualize os arquivos de configuração base do projeto.

## Projeto
App Vue 3 + TypeScript + Vite para prática de canto. Usa Firebase (variáveis sensíveis via `.env`).

## Arquivos a Criar/Atualizar

### 1. `.env.example` (CRIAR — raiz do projeto)

Template público (commitado no git) com placeholders:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=app-trilha-de-canto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=app-trilha-de-canto
VITE_FIREBASE_STORAGE_BUCKET=app-trilha-de-canto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=54339388040
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=G-556200470
```

### 2. `.env` (CRIAR — raiz do projeto, NÃO commitado)

Arquivo real com valores placeholder para o desenvolvedor preencher:

```env
VITE_FIREBASE_API_KEY=SUA_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=app-trilha-de-canto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=app-trilha-de-canto
VITE_FIREBASE_STORAGE_BUCKET=app-trilha-de-canto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=54339388040
VITE_FIREBASE_APP_ID=SEU_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=G-556200470
```

### 3. `.gitignore` (ATUALIZAR — adicionar estas linhas)

Adicionar após a linha `node_modules`:
```
.env
.env.local
```

### 4. `env.d.ts` (SOBRESCREVER — raiz do projeto)

Tipos TypeScript para as variáveis de ambiente do Vite:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### 5. `index.html` (ATUALIZAR)

Alterar:
- `<html lang="">` → `<html lang="pt-BR">`
- `<title>Vite App</title>` → `<title>Trilha de Prática de Canto</title>`

### 6. Dependências (já instaladas)

```json
{
  "dependencies": {
    "firebase": "^12.19.0",
    "pinia": "^4.0.3",
    
    "three": "^0.186.1",
    "vue": "^3.5.42",
    "vue-router": "^5.3.1"
  }
}
```

## Verificação
- `cat .env.example` → mostra os placeholders
- `cat .env` → mostra os valores (NÃO commitado)
- `grep '.env' .gitignore` → retorna `.env`
- `head index.html` → mostra `lang="pt-BR"` e título correto
