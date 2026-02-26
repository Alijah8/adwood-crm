import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Loader2, ShieldCheck, Sun, Moon } from 'lucide-react'

export function MFAVerify() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem('adwood-crm-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed?.state?.darkMode ?? false
      }
    } catch { /* ignore */ }
    return false
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmed = code.trim()
    if (!/^\d{6}$/.test(trimmed)) {
      setError('Please enter a 6-digit code')
      return
    }

    setIsLoading(true)
    try {
      const { data: factorsData } = await supabase.auth.mfa.listFactors()
      const totpFactor = factorsData?.totp?.[0]
      if (!totpFactor) {
        setError('No TOTP factor found. Please contact your admin.')
        return
      }

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      })
      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: trimmed,
      })
      if (verifyError) throw verifyError

      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-4 right-4 p-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun className="w-5 h-5 text-foreground" /> : <Moon className="w-5 h-5 text-foreground" />}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">AW</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Adwood CRM</h1>
          <p className="text-muted-foreground mt-1">Two-factor authentication</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Verify your identity
            </CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div>
                <Input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setCode(val)
                    setError(null)
                  }}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>

              <Button type="button" variant="ghost" className="w-full" onClick={handleSignOut}>
                Sign in with a different account
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Adwood CRM v2.0 &middot; Adwood Consulting
        </p>
      </div>
    </div>
  )
}
