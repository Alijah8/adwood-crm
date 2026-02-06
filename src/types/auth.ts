export type UserRole = 'admin' | 'manager' | 'sales' | 'support'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

// Role → allowed routes mapping
export const ROLE_ROUTE_ACCESS: Record<UserRole, string[]> = {
  admin: [
    '/', '/contacts', '/deals', '/calendar', '/communications',
    '/campaigns', '/payments', '/reports', '/staff', '/settings',
  ],
  manager: [
    '/', '/contacts', '/deals', '/calendar', '/communications',
    '/campaigns', '/payments', '/reports', '/settings',
  ],
  sales: [
    '/', '/contacts', '/deals', '/calendar', '/communications',
    '/campaigns', '/settings',
  ],
  support: [
    '/', '/contacts', '/calendar', '/communications', '/settings',
  ],
}

// Which roles can access each page
export const PAGE_ROLES: Record<string, UserRole[]> = {
  '/': ['admin', 'manager', 'sales', 'support'],
  '/contacts': ['admin', 'manager', 'sales', 'support'],
  '/deals': ['admin', 'manager', 'sales'],
  '/calendar': ['admin', 'manager', 'sales', 'support'],
  '/communications': ['admin', 'manager', 'sales', 'support'],
  '/campaigns': ['admin', 'manager', 'sales'],
  '/payments': ['admin', 'manager'],
  '/reports': ['admin', 'manager'],
  '/staff': ['admin'],
  '/settings': ['admin', 'manager', 'sales', 'support'],
}

export function hasRouteAccess(role: UserRole, path: string): boolean {
  const allowedRoles = PAGE_ROLES[path]
  if (!allowedRoles) return false
  return allowedRoles.includes(role)
}
