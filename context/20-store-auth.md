# Contexto 20 — Store (Auth)

> Gerencia o estado de autenticação do usuário (Google Auth) e orquestra a sincronização de dados das outras stores ao efetuar login.

## Arquivo: `src/stores/auth.ts`

## Responsabilidades
- Iniciar fluxo de login e logout com `GoogleAuthProvider`.
- Escutar mudanças de estado de autenticação via `onAuthStateChanged`.
- Disparar `syncFromCloud` das stores de `routine` e `streak` assim que o login for confirmado.
- Disponibilizar objeto `user` globalmente (para ser consumido no `PlayerControls.vue` no cabeçalho).

## Dependências
- Pinia (`defineStore`)
- Vue (`ref`)
- Firebase Auth (`signInWithPopup`, `GoogleAuthProvider`, `signOut`, `onAuthStateChanged`, `User`)
- Firebase config (`auth` de `@/lib/firebase`)
- `useRoutineStore`, `useStreakStore`

## Integração no App
O cabeçalho do `PlayerControls` utiliza `authStore.user` para exibir foto, email e saudação, e exibe as opções de Sair ou Logar com Google dependendo do estado.
