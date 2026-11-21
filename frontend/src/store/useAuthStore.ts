import { create } from 'zustand'
import type { User } from '../types/users'
import * as api from '../api/client'

interface AuthState {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (data: api.RegisterData) => Promise<void>
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  restoreSession: async () => {
    try {
      const restoredUser = await api.restoreSession()
      set({ user: restoredUser })
    } catch {
      // Si no se pudo verificar la sesión, no damos acceso.
      set({ user: null })
    } finally {
      set({ loading: false })
    }
  },

  login: async (username, password) => {
    const authenticatedUser = await api.login(username, password)
    set({ user: authenticatedUser, loading: false })
  },

  register: async (data) => {
    const authenticatedUser = await api.register(data)
    set({ user: authenticatedUser, loading: false })
  },

  logout: async () => {
    await api.logout()
    set({ user: null })
  },
}))

// Equivalente al useEffect de AuthContext: la suscripción al 401 vive
// mientras exista el módulo, igual que antes vivía mientras existía el Provider.
api.onSessionExpired(() => {
  useAuthStore.setState({ user: null })
})

// Restaurar la sesión al cargar la app (antes se hacía en el mount del Provider).
void useAuthStore.getState().restoreSession()
