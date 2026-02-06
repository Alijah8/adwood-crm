import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { hasRouteAccess } from '../types/auth'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated → redirect to login
  if (!session || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user is active
  if (!profile.is_active) {
    return <Navigate to="/login" replace />
  }

  // Check route access based on role
  if (!hasRouteAccess(profile.role, location.pathname)) {
    // Redirect to dashboard if user doesn't have access to this route
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
