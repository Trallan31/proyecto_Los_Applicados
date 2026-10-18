import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import OrganizerView from './OrganizerView'
import { ScrumView } from './ScrumView'
import { useTheme } from './context/ThemeContext'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import './index.css'

function navigationClassName({ isActive }: { isActive: boolean }) {
  const base =
    'px-6 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer'

  return `${base} ${
    isActive
      ? 'bg-panel text-text shadow-sm border border-border'
      : 'text-text-muted hover:text-text'
  }`
}

function AppLayout() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()

  return (
    <div className="w-full h-full bg-background text-text flex flex-col min-h-screen">
      <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3 w-1/3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-violet flex items-center justify-center shadow-lg shadow-accent-blue/20">
            <span className="font-bold text-white text-xs">APP</span>
          </div>

          <h1 className="text-lg font-bold tracking-tight text-text">
            Applicate
          </h1>
        </div>

        <nav
          aria-label="Navegación principal"
          className="flex justify-center w-1/3"
        >
          <div className="bg-background p-1 rounded-full flex gap-1 border border-border shadow-inner">
            <NavLink
              to="/organizador"
              className={navigationClassName}
            >
              Organizador Personal
            </NavLink>

            <NavLink
              to="/scrum"
              className={navigationClassName}
            >
              Proyectos de Equipo
            </NavLink>
          </div>
        </nav>

        <div className="w-1/3 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="p-2 rounded-lg bg-panel hover:bg-panel-hover text-text-muted hover:text-text border border-border transition-colors flex items-center justify-center cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <div
            title={user?.name}
            className="w-8 h-8 rounded-full bg-panel border border-border flex items-center justify-center text-text"
          >
            <span className="text-xs font-semibold">
              {user?.name.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            className="text-xs text-text-muted hover:text-text cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/organizador"
            element={<OrganizerView />}
          />
          <Route
            path="/scrum"
            element={<ScrumView />}
          />
        </Route>
      </Route>

      <Route
        path="/"
        element={<Navigate to="/organizador" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  )
}