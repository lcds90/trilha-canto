import { defineStore } from 'pinia'
import { ref } from 'vue'
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRoutineStore } from './routine'
import { useStreakStore } from './streak'

export const useAuthStore = defineStore('auth', () => {
  const provider = new GoogleAuthProvider()
  const user = ref<User | null>(null)
  const loading = ref(true)

  onAuthStateChanged(auth, async (u) => {
    user.value = u
    loading.value = false
    if (u) {
      const routineStore = useRoutineStore()
      const streakStore = useStreakStore()
      await routineStore.syncFromCloud()
      await streakStore.syncFromCloud()
    }
  })

  async function login() {
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      console.error('Login error', err)
    }
  }

  async function logout() {
    try {
      await signOut(auth)
      // When logging out, we can optionally clear or reset state
      // For now we keep the local state so the user can continue using it offline
    } catch (err) {
      console.error('Logout error', err)
    }
  }

  return {
    user,
    loading,
    login,
    logout
  }
})
