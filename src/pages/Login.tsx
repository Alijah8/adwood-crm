import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Eye, EyeOff, Lock, Mail, Sun, Moon, Loader2 } from 'lucide-react'

export function Login() {
  const navigate = useNavigate()
  const { login, session, error: authError, clearError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)

  // Dark mode state (reads from localStorage independently of store)
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem('adwood-crm-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed?.state?.darkMode ?? false
      }
    } catch {
      // ignore
    }
    return false
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      navigate('/', { replace: true })
    }
  }, [session, navigate])

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setLocalError('Email is required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError('Please enter a valid email address')
      return false
    }
    if (!password) {
      setLocalError('Password is required')
      return false
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch {
      // Error is set in AuthContext
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail.trim()) {
      setLocalError('Please enter your email address')
      return
    }

    setIsLoading(true)
    setLocalError(null)

    try {
      const { supabase } = await import('../lib/supabase')
      const redirectUrl = `${import.meta.env.VITE_APP_URL || window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(
        resetEmail.trim().toLowerCase(),
        { redirectTo: redirectUrl }
      )
      if (error) throw error
      setResetSent(true)
    } catch {
      setLocalError('Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const displayError = localError || authError

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Dark mode toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-4 right-4 p-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <Sun className="w-5 h-5 text-foreground" />
        ) : (
          <Moon className="w-5 h-5 text-foreground" />
        )}
      </button>

      <div className="w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">AW</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Adwood CRM</h1>
          <p className="text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        {!showForgotPassword ? (
          /* Login Form */
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Welcome back</CardTitle>
              <CardDescription>Enter your credentials to access your CRM</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {displayError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {displayError}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="text-sm font-medium mb-1.5 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setLocalError(null) }}
                      className="pl-10"
                      autoComplete="email"
                      autoFocus
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="text-sm font-medium mb-1.5 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setLocalError(null) }}
                      className="pl-10 pr-10"
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setLocalError(null); clearError() }}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Forgot Password Form */
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Reset password</CardTitle>
              <CardDescription>
                {resetSent
                  ? 'Check your email for a reset link'
                  : "Enter your email and we'll send you a reset link"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resetSent ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm">
                    Password reset email sent to <strong>{resetEmail}</strong>. Check your inbox.
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowForgotPassword(false)
                      setResetSent(false)
                      setResetEmail('')
                    }}
                  >
                    Back to login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {displayError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      {displayError}
                    </div>
                  )}

                  <div>
                    <label htmlFor="reset-email" className="text-sm font-medium mb-1.5 block">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="you@company.com"
                        value={resetEmail}
                        onChange={(e) => { setResetEmail(e.target.value); setLocalError(null) }}
                        className="pl-10"
                        autoComplete="email"
                        autoFocus
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send reset link'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => { setShowForgotPassword(false); setLocalError(null); clearError() }}
                  >
                    Back to login
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Adwood CRM v2.0 &middot; Adwood Consulting
        </p>
      </div>
    </div>
  )
}
