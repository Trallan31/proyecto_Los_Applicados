import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen bg-background" />
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname)

    return <Navigate to={`/login?next=${next}`} replace />
  }

  return <Outlet />
}