import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    const next = encodeURIComponent(location.pathname)

    return <Navigate to={`/login?next=${next}`} replace />
  }

  return <Outlet />
}