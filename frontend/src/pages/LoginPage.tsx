import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { describeError } from "../api/client";

export default function LoginPage() {
  const { user, login } = useAuth()
  const [searchParams] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const next = searchParams.get('next')

  // Solo aceptamos destinos que pertenecen a nuestras vistas.
  const destination =
    next === '/scrum' || next === '/organizador'
      ? next
      : '/organizador'

  if (user) {
    return <Navigate to={destination} replace />
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      await login(username, password)
    } catch (error: unknown) {
      setError(describeError(error));
    }
  }

  return (
    <main className="min-h-screen bg-background text-text flex items-center justify-center px-6">
      <section className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <img
            src="/logo.png"
            alt="Applicate Logo"
            className="w-11 h-11 rounded-xl shadow-md shadow-accent-blue/20 object-cover"
          />
          <div>
            <span className="text-xl font-bold tracking-tight text-text block leading-tight">
              Applicate
            </span>
            <span className="text-xs text-text-muted">Gestión de proyectos y horario</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-3">
          Iniciar sesión
        </h1>

        <p className="text-text-muted mb-6">
          Necesitas una sesión para acceder al Organizador y a los
          Proyectos de Equipo.
        </p>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm">
            Usuario o correo
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              autoComplete="username"
              required
            />
          </label>
          <label className="block text-sm">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              autoComplete="current-password"
              required
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-accent-blue px-4 py-3 font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
          >
            Iniciar sesión
          </button>
        </form>

        <p className="mt-6 text-sm text-text-muted">
          ¿No tienes cuenta?{' '}
          <Link
            to="/registro"
            className="text-accent-blue font-semibold hover:underline"
          >
            Crear una
          </Link>
        </p>
      </section>
    </main>
  )
}