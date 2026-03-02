import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { hasRouteAccess } from '../types/auth'
import { supabase } from '../lib/supabase'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()
  const [mfaRequired, setMfaRequired] = useState(false)

  useEffect(() => {
    if (!session) return

    supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      .then(({ data }) => {
        if (data?.nextLevel === 'aal2' && data.currentLevel !== 'aal2') {
          setMfaRequired(true)
        }
      })
      .catch(() => {}) // RLS policies are the real security backstop
  }, [session])

  console.log('[ROUTE]', { loading, hasSession: !!session, hasProfile: !!profile, mfaRequired, path: location.pathname })

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
    console.log('[ROUTE] No session/profile — redirecting to login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user is active
  if (!profile.is_active) {
    return <Navigate to="/login" replace />
  }

  // MFA enrolled but session not at aal2 → redirect to MFA verify
  if (mfaRequired) {
    return <Navigate to="/mfa-verify" replace />
  }

  // Check route access based on role
  if (!hasRouteAccess(profile.role, location.pathname)) {
    // Redirect to dashboard if user doesn't have access to this route
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
