import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { describeError } from '../api/client'

const inputClassName =
  'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2'

export default function RegisterPage() {
  const { user, register } = useAuth()
  const [form, setForm] = useState({
    name: '',
    lastName: '',
    username: '',
    mail: '',
    password: '',
  })
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (user) {
    return <Navigate to="/organizador" replace />
  }

  const setField = (field: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (form.password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setSaving(true)
    try {
      await register(form)
    } catch (registerError: unknown) {
      setError(describeError(registerError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-text flex items-center justify-center px-6 py-10">
      <section className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold mb-3">Crear cuenta</h1>

        <p className="text-text-muted mb-6">
          Registra tus datos para empezar a usar el Organizador y los
          Proyectos de Equipo.
        </p>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-3">
            <label className="block text-sm flex-1">
              Nombre
              <input
                value={form.name}
                onChange={setField('name')}
                className={inputClassName}
                autoComplete="given-name"
                required
              />
            </label>
            <label className="block text-sm flex-1">
              Apellido
              <input
                value={form.lastName}
                onChange={setField('lastName')}
                className={inputClassName}
                autoComplete="family-name"
                required
              />
            </label>
          </div>
          <label className="block text-sm">
            Usuario
            <input
              value={form.username}
              onChange={setField('username')}
              className={inputClassName}
              autoComplete="username"
              required
            />
          </label>
          <label className="block text-sm">
            Correo
            <input
              type="email"
              value={form.mail}
              onChange={setField('mail')}
              className={inputClassName}
              autoComplete="email"
              required
            />
          </label>
          <label className="block text-sm">
            Contraseña
            <input
              type="password"
              value={form.password}
              onChange={setField('password')}
              className={inputClassName}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label className="block text-sm">
            Repetir contraseña
            <input
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className={inputClassName}
              autoComplete="new-password"
              required
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-accent-blue px-4 py-3 font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-sm text-text-muted">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="text-accent-blue font-semibold hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </section>
    </main>
  )
}
