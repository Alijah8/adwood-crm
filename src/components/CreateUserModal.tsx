import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent } from './ui/card'
import type { UserRole } from '../types/auth'
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface CreateUserModalProps {
  onClose: () => void
  onUserCreated: () => void
}

export function CreateUserModal({ onClose, onUserCreated }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'sales' as UserRole,
    phone: '',
  })
  const [tempPassword, setTempPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const generatePassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const lower = 'abcdefghjkmnpqrstuvwxyz'
    const digits = '23456789'
    const special = '!@#$%'
    const all = upper + lower + digits + special

    const randomIndex = (len: number) => {
      const arr = new Uint32Array(1)
      crypto.getRandomValues(arr)
      return arr[0] % len
    }

    let password = ''
    // Ensure at least one of each required type
    password += upper[randomIndex(upper.length)]
    password += lower[randomIndex(lower.length)]
    password += digits[randomIndex(digits.length)]
    password += special[randomIndex(special.length)]
    for (let i = 4; i < 12; i++) {
      password += all[randomIndex(all.length)]
    }
    // Fisher-Yates shuffle using crypto
    const chars = password.split('')
    for (let j = chars.length - 1; j > 0; j--) {
      const k = randomIndex(j + 1)
      ;[chars[j], chars[k]] = [chars[k], chars[j]]
    }
    return chars.join('')
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Please enter a valid email address')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    setIsLoading(true)
    const password = generatePassword()

    try {
      // Step 1: Sign up the user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: formData.name.trim(),
            role: formData.role,
          },
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('A user with this email already exists')
        }
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Failed to create user')
      }

      // Step 2: Insert profile (the trigger might handle this, but let's ensure it)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: formData.email.trim().toLowerCase(),
          name: formData.name.trim(),
          role: formData.role,
          phone: formData.phone.trim() || null,
          is_active: true,
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Profile might have been created by trigger, that's OK
      }

      setTempPassword(password)
      setSuccess(true)
      onUserCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">
            {success ? 'User Created' : 'Add Team Member'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {success ? (
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium">{formData.name} has been added</p>
              <p className="text-sm text-muted-foreground mt-1">
                Share these credentials with them to log in
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-mono">{formData.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Temporary Password</p>
                <p className="text-sm font-mono font-bold">{tempPassword}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm capitalize">{formData.role}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                Copy these credentials now. The password will not be shown again.
                The user should change their password after first login via Settings.
              </p>
            </div>

            <Button className="w-full" onClick={onClose}>
              Done
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 p-6">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1 block">Full Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setError(null) }}
                  placeholder="e.g. Jane Smith"
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setError(null) }}
                  placeholder="jane@adwoodconsulting.us"
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={isLoading}
                >
                  <option value="admin">Admin - Full access, user management</option>
                  <option value="manager">Manager - All data, reports, no user mgmt</option>
                  <option value="sales">Sales - Contacts, deals, calendar, campaigns</option>
                  <option value="support">Support - Contacts (read), comms, calendar</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  disabled={isLoading}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                A temporary password will be generated. Share it with the team member so they can log in.
              </p>
            </CardContent>

            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
