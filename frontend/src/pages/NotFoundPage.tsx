import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'

export default function NotFoundPage() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-background text-text flex items-center justify-center px-6">
      <section className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-lg flex flex-col items-center text-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-panel border border-border flex items-center justify-center">
          <Compass className="w-7 h-7 text-accent-blue" />
        </div>

        <div>
          <p className="text-5xl font-bold tracking-tight text-text">404</p>
          <h1 className="mt-2 text-xl font-bold text-text">
            Página no encontrada
          </h1>
          <p className="mt-3 text-sm text-text-muted">
            No encontramos la ruta{' '}
            <code className="px-1.5 py-0.5 rounded bg-panel border border-border font-mono text-xs text-text">
              {location.pathname}
            </code>
          </p>
        </div>

        <div className="w-full flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel hover:bg-panel-hover text-text px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-accent-blue hover:opacity-90 text-white px-4 py-2.5 text-sm font-semibold transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          >
            Ir al inicio
          </Link>
        </div>
      </section>
    </main>
  )
}