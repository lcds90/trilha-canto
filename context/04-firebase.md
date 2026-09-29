# Contexto 04 — Firebase (Inicialização)

> Crie o arquivo `src/lib/firebase.ts` que inicializa o Firebase App.

## Arquivo: `src/lib/firebase.ts`

## Pré-requisitos
- Pacote `firebase` instalado (^12.19)
- Variáveis de ambiente definidas em `.env` com prefixo `VITE_` (ver contexto 02)
- Tipos de env declarados em `env.d.ts` (ver contexto 02)

## Código Completo

```typescript
import { getFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const firebaseApp = initializeApp(firebaseConfig)

export default firebaseApp

export const db = getFirestore(firebaseApp)
export const auth = getAuth(firebaseApp)
```

## Como é usado
- Importado por `src/lib/ai.ts` para inicializar o serviço de IA
- Importado pelas stores `routine.ts`, `streak.ts` e `auth.ts` para realizar operações no Firestore e autenticação.

## Notas
- `import.meta.env` é a forma do Vite de acessar variáveis de ambiente
- Variáveis com prefixo `VITE_` são expostas ao client-side
- As chaves do Firebase são de configuração pública (não são secrets de API privada)
