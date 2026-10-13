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
  const [user, setUser] = useState<AuthUser | null>(null)

  const startDemoSession = () => {
    // Esta simulación solo está disponible en desarrollo.
    if (!import.meta.env.DEV) return

    setUser({
      id: 'demo',
      username: 'demo',
      name: 'Usuario de prueba',
    })
  }

  const endDemoSession = () => {
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