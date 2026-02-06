import { useState } from 'react'
import { Header } from '../components/layout/Header'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { useCRMStore } from '../store'
import { formatDate, getInitials } from '../lib/utils'
import type { Staff } from '../types'
import { X, Mail, Users as UsersIcon } from 'lucide-react'

const roleConfig = {
  admin: { label: 'Admin', color: 'destructive' },
  manager: { label: 'Manager', color: 'warning' },
  sales: { label: 'Sales', color: 'info' },
  support: { label: 'Support', color: 'secondary' },
} as const

export function Staff() {
  const { staff, addStaff, updateStaff } = useCRMStore()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'sales' as Staff['role'],
    phone: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addStaff({ ...formData, isActive: true })
    setShowForm(false)
    setFormData({ name: '', email: '', role: 'sales', phone: '' })
  }

  const toggleActive = (id: string, isActive: boolean) => {
    updateStaff(id, { isActive: !isActive })
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Staff"
        subtitle={`${staff.length} team members`}
        action={{ label: 'Add Staff', onClick: () => setShowForm(true) }}
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-lg">{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{member.name}</h3>
                      {!member.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <Badge variant={roleConfig[member.role].color} className="mb-2">
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
                      Joined {formatDate(member.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex gap-2">
                  <Button
                    variant={member.isActive ? 'outline' : 'default'}
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleActive(member.id, member.isActive)}
                  >
                    {member.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {staff.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No staff members yet</p>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">Add Staff Member</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 p-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Staff['role'] })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="sales">Sales</option>
                    <option value="support">Support</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 p-6 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Add Staff</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
