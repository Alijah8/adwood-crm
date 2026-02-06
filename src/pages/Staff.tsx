import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { CreateUserModal } from '../components/CreateUserModal'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { getInitials, formatDate } from '../lib/utils'
import type { UserProfile } from '../types/auth'
import { Mail, Users as UsersIcon, Loader2, RefreshCw, KeyRound, Shield } from 'lucide-react'

const roleConfig = {
  admin: { label: 'Admin', color: 'destructive' },
  manager: { label: 'Manager', color: 'warning' },
  sales: { label: 'Sales', color: 'info' },
  support: { label: 'Support', color: 'secondary' },
} as const

export function Staff() {
  const { profile } = useAuth()
  const [staffList, setStaffList] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Only admins can see this page
  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching staff:', error)
    } else {
      setStaffList(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const toggleActive = async (userId: string, currentlyActive: boolean) => {
    setActionLoading(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentlyActive, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      console.error('Error toggling user status:', error)
    } else {
      setStaffList(prev =>
        prev.map(s => s.id === userId ? { ...s, is_active: !currentlyActive } : s)
      )
    }
    setActionLoading(null)
  }

  const sendPasswordReset = async (email: string, userId: string) => {
    setActionLoading(userId)
    const redirectUrl = `${import.meta.env.VITE_APP_URL || window.location.origin}/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      console.error('Error sending password reset:', error)
      alert('Failed to send password reset email. Please try again.')
    } else {
      alert(`Password reset email sent to ${email}`)
    }
    setActionLoading(null)
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Staff"
        subtitle={`${staffList.length} team members`}
        action={{ label: 'Add Staff', onClick: () => setShowCreateModal(true) }}
      />

      <div className="flex-1 p-6 overflow-auto">
        {/* Refresh button */}
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={fetchStaff} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading team members...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {staffList.map((member) => (
                <Card key={member.id} className={!member.is_active ? 'opacity-60' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-lg">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{member.name}</h3>
                          {!member.is_active && <Badge variant="secondary">Inactive</Badge>}
                          {member.id === profile?.id && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <Badge variant={roleConfig[member.role].color} className="mb-2">
                          <Shield className="w-3 h-3 mr-1" />
                          {roleConfig[member.role].label}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        {member.phone && (
                          <p className="text-sm text-muted-foreground mt-1">{member.phone}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Joined {formatDate(member.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex gap-2">
                      <Button
                        variant={member.is_active ? 'outline' : 'default'}
                        size="sm"
                        className="flex-1"
                        onClick={() => toggleActive(member.id, member.is_active)}
                        disabled={actionLoading === member.id || member.id === profile?.id}
                      >
                        {actionLoading === member.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : member.is_active ? (
                          'Deactivate'
                        ) : (
                          'Activate'
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => sendPasswordReset(member.email, member.id)}
                        disabled={actionLoading === member.id}
                        title="Send password reset email"
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {staffList.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No staff members yet</p>
                <p className="text-sm mt-1">Click "Add Staff" to create user accounts</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onUserCreated={fetchStaff}
        />
      )}
    </div>
  )
}
