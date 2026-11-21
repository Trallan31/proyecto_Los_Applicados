import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function ProtectedRoute() {
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen bg-background" />
  }

  if (!user) {
    const next = encodeURIComponent(
      `${location.pathname}${location.search}${location.hash}`
    )

    return <Navigate to={`/login?next=${next}`} replace />
  }

  return <Outlet />
}