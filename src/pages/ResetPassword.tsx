import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Dark mode (read from localStorage)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('adwood-crm-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.state?.darkMode) {
          document.documentElement.classList.add('dark')
        }
      }
    } catch {
      // ignore
    }
  }, [])

  const validatePassword = (): boolean => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter')
      return false
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter')
      return false
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validatePassword()) return

    setIsLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">AW</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Adwood CRM</h1>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {success ? 'Password updated' : 'Set new password'}
            </CardTitle>
            <CardDescription>
              {success
                ? 'Redirecting to login...'
                : 'Choose a strong password for your account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Your password has been updated. Redirecting to login...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="new-password" className="text-sm font-medium mb-1.5 block">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 chars, uppercase, lowercase, number"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null) }}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      autoFocus
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="text-sm font-medium mb-1.5 block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(null) }}
                      className="pl-10"
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p className={password.length >= 8 ? 'text-green-600' : ''}>
                    {password.length >= 8 ? '✓' : '○'} At least 8 characters
                  </p>
                  <p className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                    {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
                  </p>
                  <p className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                    {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
                  </p>
                  <p className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                    {/[0-9]/.test(password) ? '✓' : '○'} One number
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update password'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
