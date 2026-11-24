import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function readStoredTheme(): Theme | null {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
  } catch {
    // Ignoramos errores si localStorage está bloqueado o no disponible.
  }
  return null
}

function writeStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // Ignoramos errores si localStorage está bloqueado o no disponible.
  }
}

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const saved = readStoredTheme()
    if (saved) {
      return saved
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light'
    }
  }
  return 'dark'
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    writeStoredTheme(theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/**
 * Devuelve true si el tema activo es oscuro.
 * A diferencia de useTheme, no falla si el componente se renderiza sin ThemeProvider (ej. tests aislados).
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useIsDark(): boolean {
  const context = useContext(ThemeContext)
  if (context) {
    return context.theme === 'dark'
  }
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark')
  }
  return false
}
