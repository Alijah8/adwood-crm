import { useAuth } from './useAuth'
import { hasRouteAccess } from '../types/auth'
import type { UserRole } from '../types/auth'

export function useRole() {
  const { profile } = useAuth()

  const role = profile?.role || null

  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const isSales = role === 'sales'
  const isSupport = role === 'support'

  const canAccess = (path: string): boolean => {
    if (!role) return false
    return hasRouteAccess(role, path)
  }

  const hasRole = (requiredRoles: UserRole[]): boolean => {
    if (!role) return false
    return requiredRoles.includes(role)
  }

  return {
    role,
    isAdmin,
    isManager,
    isSales,
    isSupport,
    canAccess,
    hasRole,
  }
}
