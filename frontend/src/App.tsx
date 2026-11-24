import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import OrganizerView from './OrganizerView'
import { ScrumView } from './ScrumView'
import { useTheme } from './context/ThemeContext'
import { useAuthStore } from './store/useAuthStore'
import { useToastStore } from './store/useToastStore'
import ProtectedRoute from './components/ProtectedRoute'
import { ToastViewport } from './components/shared/Feedback'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NotFoundPage from './pages/NotFoundPage'
import { useState } from "react";
import { describeError } from "./api/client";
import './index.css'

function navigationClassName({ isActive }: { isActive: boolean }) {
  const base =
    'px-4 sm:px-6 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap'

  return `${base} ${
    isActive
      ? 'bg-panel text-text shadow-sm border border-border'
      : 'text-text-muted hover:text-text'
  }`
}

function AppLayout() {
  const { theme, toggleTheme } = useTheme()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout(): Promise<void> {
    setLoggingOut(true);
    try {
      await logout();
    } catch (error: unknown) {
      useToastStore.getState().showError(describeError(error), { tag: "logout-error" });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="w-full h-screen bg-background text-text flex flex-col overflow-hidden">
      {/* En movil el header se apila: logo y acciones arriba, navegacion abajo. */}
      <header className="min-h-16 bg-surface/80 backdrop-blur-md border-b border-border flex flex-wrap items-center justify-between gap-y-2 px-4 sm:px-6 py-2 sm:py-0 sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 sm:w-1/3">
          <img
            src="/logo.png"
            alt="Applicate Logo"
            className="w-9 h-9 rounded-lg shadow-md shadow-accent-blue/20 object-cover"
          />

          <h1 className="text-lg font-bold tracking-tight text-text">
            Applicate
          </h1>
        </div>

        <nav
          aria-label="Navegación principal"
          className="order-last w-full flex justify-center sm:order-none sm:w-1/3"
        >
          <div className="bg-background p-1 rounded-full flex gap-1 border border-border shadow-inner">
            <NavLink
              to="/organizador"
              className={navigationClassName}
            >
              <span className="sm:hidden">Organizador</span>
              <span className="hidden sm:inline">Organizador Personal</span>
            </NavLink>

            <NavLink
              to="/scrum"
              className={navigationClassName}
            >
              <span className="sm:hidden">Equipo</span>
              <span className="hidden sm:inline">Proyectos de Equipo</span>
            </NavLink>
          </div>
        </nav>

        <div className="flex items-center justify-end gap-2 sm:gap-3 ml-auto sm:w-1/3">
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
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="text-xs text-text-muted hover:text-text cursor-pointer whitespace-nowrap"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />

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
          element={<NotFoundPage />}
        />
      </Routes>
      <ToastViewport />
    </>
  )
}