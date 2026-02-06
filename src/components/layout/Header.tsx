import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Search, Plus, LogOut, Settings, UserCog } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { useAuth } from '../../hooks/useAuth'

interface HeaderProps {
  title: string
  subtitle?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setShowMenu(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 w-64"
          />
        </div>

        {/* Action Button */}
        {action && (
          <Button onClick={action.onClick} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {action.label}
          </Button>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* User Avatar + Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
              {/* User info */}
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium truncate">{profile?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                  {profile?.role}
                </span>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>

                {profile?.role === 'admin' && (
                  <Link
                    to="/staff"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <UserCog className="w-4 h-4" />
                    Manage Users
                  </Link>
                )}
              </div>

              <div className="border-t border-border py-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
