import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types/auth'

interface RoleGateProps {
  requiredRoles: UserRole[]
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGate({ requiredRoles, children, fallback = null }: RoleGateProps) {
  const { profile } = useAuth()

  if (!profile || !requiredRoles.includes(profile.role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
