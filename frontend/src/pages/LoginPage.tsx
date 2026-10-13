import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { user, startDemoSession } = useAuth()
  const [searchParams] = useSearchParams()

  const next = searchParams.get('next')

  // Solo aceptamos destinos que pertenecen a nuestras vistas.
  const destination =
    next === '/scrum' || next === '/organizador'
      ? next
      : '/organizador'

  if (user) {
    return <Navigate to={destination} replace />
  }

  return (
    <main className="min-h-screen bg-background text-text flex items-center justify-center px-6">
      <section className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold mb-3">
          Iniciar sesión
        </h1>

        <p className="text-text-muted mb-6">
          Necesitas una sesión para acceder al Organizador y a los
          Proyectos de Equipo.
        </p>

        {import.meta.env.DEV ? (
          <>
            <p className="text-sm text-text-muted mb-4">
              Modo de desarrollo: este acceso simula una sesión para
              probar las rutas. El login real se implementará en la
              tarea de autenticación.
            </p>

            <button
              type="button"
              onClick={startDemoSession}
              className="w-full rounded-lg bg-accent-blue px-4 py-3 font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
            >
              Entrar con sesión de prueba
            </button>
          </>
        ) : (
          <p className="text-sm text-text-muted">
            El inicio de sesión estará disponible cuando se conecte
            el backend de autenticación.
          </p>
        )}
      </section>
    </main>
  )
}