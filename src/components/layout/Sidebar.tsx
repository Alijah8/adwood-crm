import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useCRMStore } from '../../store'
import { Button } from '../ui/button'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FolderKanban,
  MessageSquare,
  CreditCard,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Megaphone,
  BarChart3,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Deals', href: '/deals', icon: FolderKanban },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Communications', href: '/communications', icon: MessageSquare },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Staff', href: '/staff', icon: UserCog },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, toggleSidebar, darkMode, toggleDarkMode } = useCRMStore()

  return (
    <div
      className={cn(
        'flex flex-col bg-card border-r border-border transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border">
        {sidebarOpen ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AW</span>
            </div>
            <span className="font-semibold text-lg">Adwood CRM</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-sm">AW</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                !sidebarOpen && 'justify-center'
              )}
              title={!sidebarOpen ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-border space-y-1">
        <Button
          variant="ghost"
          size={sidebarOpen ? 'default' : 'icon'}
          onClick={toggleDarkMode}
          className={cn('w-full', sidebarOpen ? 'justify-start' : '')}
        >
          {darkMode ? (
            <>
              <Sun className="w-5 h-5" />
              {sidebarOpen && <span className="ml-2">Light Mode</span>}
            </>
          ) : (
            <>
              <Moon className="w-5 h-5" />
              {sidebarOpen && <span className="ml-2">Dark Mode</span>}
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="w-full"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  )
}
