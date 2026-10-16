import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface AuthUser {
  id: string
  username: string
  name: string
}

interface AuthContextType {
  user: AuthUser | null
  startDemoSession: () => void
  endDemoSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('demo_user')
      if (stored) {
        try {
          return JSON.parse(stored) as AuthUser
        } catch {
          // Si el JSON falla, continuamos
        }
      }
      if (
        import.meta.env.DEV &&
        (new URLSearchParams(window.location.search).get('demo') === '1' ||
          new URLSearchParams(window.location.search).get('demo') === 'true')
      ) {
        return {
          id: 'demo',
          username: 'demo',
          name: 'Usuario de prueba',
        }
      }
    }
    return null
  })

  const startDemoSession = () => {
    // Esta simulación solo está disponible en desarrollo.
    if (!import.meta.env.DEV) return

    const demoUser: AuthUser = {
      id: 'demo',
      username: 'demo',
      name: 'Usuario de prueba',
    }
    try {
      localStorage.setItem('demo_user', JSON.stringify(demoUser))
    } catch {
      // localStorage no disponible
    }
    setUser(demoUser)
  }

  const endDemoSession = () => {
    try {
      localStorage.removeItem('demo_user')
    } catch {
      // localStorage no disponible
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, startDemoSession, endDemoSession }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Mismo patrón que el hook useTheme del proyecto.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  return context
}