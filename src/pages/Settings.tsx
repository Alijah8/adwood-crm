import { useState, useEffect } from 'react'
import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useCRMStore } from '../store'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import {
  Download, Trash2, Moon, Sun, Database, Webhook, Mail, Globe,
  User, Lock, Loader2, CheckCircle2, ShieldCheck, ShieldOff,
} from 'lucide-react'

export function Settings() {
  const { darkMode, toggleDarkMode, clearAllData, contacts, deals, tasks, events, payments } = useCRMStore()
  const { profile, updateProfile, updatePassword } = useAuth()

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // MFA state
  const [mfaEnrolled, setMfaEnrolled] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaEnrolling, setMfaEnrolling] = useState(false)
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null)
  const [mfaSecret, setMfaSecret] = useState<string | null>(null)
  const [mfaPendingFactorId, setMfaPendingFactorId] = useState<string | null>(null)
  const [mfaVerifyCode, setMfaVerifyCode] = useState('')
  const [mfaError, setMfaError] = useState<string | null>(null)
  const [mfaSuccess, setMfaSuccess] = useState<string | null>(null)

  // Load MFA enrollment status
  useEffect(() => {
    async function checkMFA() {
      try {
        const { data } = await supabase.auth.mfa.listFactors()
        const verifiedTotp = data?.totp?.find((f) => f.status === 'verified')
        if (verifiedTotp) {
          setMfaEnrolled(true)
          setMfaFactorId(verifiedTotp.id)
        } else {
          setMfaEnrolled(false)
          setMfaFactorId(null)
        }
      } catch (err) {
        console.error('MFA status check failed:', err)
      }
    }
    checkMFA()
  }, [])

  const handleMfaEnroll = async () => {
    setMfaLoading(true)
    setMfaError(null)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (error) throw error
      setMfaQrCode(data.totp.qr_code)
      setMfaSecret(data.totp.secret)
      setMfaPendingFactorId(data.id)
      setMfaEnrolling(true)
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Failed to start enrollment')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleMfaVerifyEnrollment = async () => {
    if (!mfaPendingFactorId || !/^\d{6}$/.test(mfaVerifyCode.trim())) {
      setMfaError('Please enter a valid 6-digit code')
      return
    }
    setMfaLoading(true)
    setMfaError(null)
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaPendingFactorId,
      })
      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaPendingFactorId,
        challengeId: challengeData.id,
        code: mfaVerifyCode.trim(),
      })
      if (verifyError) throw verifyError

      setMfaEnrolled(true)
      setMfaFactorId(mfaPendingFactorId)
      setMfaEnrolling(false)
      setMfaQrCode(null)
      setMfaSecret(null)
      setMfaPendingFactorId(null)
      setMfaVerifyCode('')
      setMfaSuccess('Two-factor authentication enabled successfully')
      setTimeout(() => setMfaSuccess(null), 3000)
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleMfaUnenroll = async () => {
    if (!mfaFactorId) return
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) return

    setMfaLoading(true)
    setMfaError(null)
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId })
      if (error) throw error
      setMfaEnrolled(false)
      setMfaFactorId(null)
      setMfaSuccess('Two-factor authentication disabled')
      setTimeout(() => setMfaSuccess(null), 3000)
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Failed to disable 2FA')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleProfileSave = async () => {
    if (!profileForm.name.trim()) return
    setProfileLoading(true)
    try {
      await updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim() || undefined,
      })
      setEditingProfile(false)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to update profile:', err)
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError(null)
    const { newPassword, confirmPassword } = passwordForm

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('Password must contain at least one uppercase letter')
      return
    }
    if (!/[a-z]/.test(newPassword)) {
      setPasswordError('Password must contain at least one lowercase letter')
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordError('Password must contain at least one number')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordLoading(true)
    try {
      await updatePassword(newPassword)
      setChangingPassword(false)
      setPasswordForm({ newPassword: '', confirmPassword: '' })
      setPasswordSuccess(true)
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const exportData = () => {
    const data = {
      contacts,
      deals,
      tasks,
      events,
      payments,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `adwood-crm-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" subtitle="Configure your CRM" />

      <div className="flex-1 p-6 space-y-6 overflow-auto max-w-3xl">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-5 h-5" />
              Account
            </CardTitle>
            <CardDescription>Your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Profile updated successfully
              </div>
            )}

            {editingProfile ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Name</label>
                  <Input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    disabled={profileLoading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone</label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    disabled={profileLoading}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleProfileSave} disabled={profileLoading}>
                    {profileLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setEditingProfile(false)} disabled={profileLoading}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{profile?.name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{profile?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{profile?.phone || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">{profile?.role}</p>
                </div>
                <Button variant="outline" onClick={() => {
                  setProfileForm({ name: profile?.name || '', phone: profile?.phone || '' })
                  setEditingProfile(true)
                }}>
                  Edit Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your password and two-factor authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Password Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Password</h3>
              {passwordSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm mb-4">
                  <CheckCircle2 className="w-4 h-4" />
                  Password updated successfully
                </div>
              )}

              {changingPassword ? (
                <div className="space-y-3">
                  {passwordError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      {passwordError}
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium mb-1 block">New Password</label>
                    <Input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => { setPasswordForm({ ...passwordForm, newPassword: e.target.value }); setPasswordError(null) }}
                      placeholder="Min 8 chars, uppercase, lowercase, number"
                      disabled={passwordLoading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Confirm Password</label>
                    <Input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => { setPasswordForm({ ...passwordForm, confirmPassword: e.target.value }); setPasswordError(null) }}
                      placeholder="Re-enter your new password"
                      disabled={passwordLoading}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handlePasswordChange} disabled={passwordLoading}>
                      {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Update Password
                    </Button>
                    <Button variant="outline" onClick={() => { setChangingPassword(false); setPasswordError(null) }} disabled={passwordLoading}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setChangingPassword(true)}>
                  Change Password
                </Button>
              )}
            </div>

            <div className="border-t border-border" />

            {/* Two-Factor Authentication Section */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                Two-Factor Authentication
                {mfaEnrolled && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-xs font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    Enabled
                  </span>
                )}
              </h3>

              {mfaSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm mb-4">
                  <CheckCircle2 className="w-4 h-4" />
                  {mfaSuccess}
                </div>
              )}

              {mfaError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4">
                  {mfaError}
                </div>
              )}

              {mfaEnrolling ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code to confirm.
                  </p>
                  {mfaQrCode && (
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      <img src={mfaQrCode} alt="TOTP QR Code" className="w-48 h-48" />
                    </div>
                  )}
                  {mfaSecret && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Manual entry key:</p>
                      <code className="text-sm font-mono select-all break-all">{mfaSecret}</code>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Verification Code</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      maxLength={6}
                      value={mfaVerifyCode}
                      onChange={(e) => {
                        setMfaVerifyCode(e.target.value.replace(/\D/g, ''))
                        setMfaError(null)
                      }}
                      className="text-center text-lg tracking-[0.3em] font-mono max-w-[200px]"
                      disabled={mfaLoading}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleMfaVerifyEnrollment} disabled={mfaLoading || mfaVerifyCode.length !== 6}>
                      {mfaLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Confirm
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setMfaEnrolling(false)
                      setMfaQrCode(null)
                      setMfaSecret(null)
                      setMfaPendingFactorId(null)
                      setMfaVerifyCode('')
                      setMfaError(null)
                    }} disabled={mfaLoading}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : mfaEnrolled ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Your account is protected with TOTP-based two-factor authentication.
                  </p>
                  <Button variant="outline" onClick={handleMfaUnenroll} disabled={mfaLoading}>
                    {mfaLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldOff className="w-4 h-4 mr-2" />}
                    Disable 2FA
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security by requiring a code from your authenticator app when signing in.
                  </p>
                  <Button variant="outline" onClick={handleMfaEnroll} disabled={mfaLoading}>
                    {mfaLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                    Enable Two-Factor Authentication
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              Appearance
            </CardTitle>
            <CardDescription>Customize how your CRM looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <Button variant="outline" onClick={toggleDarkMode}>
                {darkMode ? (
                  <>
                    <Sun className="w-4 h-4 mr-2" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 mr-2" />
                    Dark Mode
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Management
            </CardTitle>
            <CardDescription>Export, import, or reset your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-muted-foreground">Download all your CRM data as JSON</p>
              </div>
              <Button variant="outline" onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            {profile?.role === 'admin' && (
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-destructive">Reset All Data</p>
                  <p className="text-sm text-muted-foreground">Archive all CRM data (recoverable for 30 days)</p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure? Data will be archived and recoverable for 30 days, then permanently deleted.')) {
                      clearAllData()
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
            )}
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Integrations
            </CardTitle>
            <CardDescription>Connect with external services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <img src="https://n8n.io/favicon.ico" alt="n8n" className="w-6 h-6" onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }} />
                </div>
                <div>
                  <p className="font-medium">n8n Webhooks</p>
                  <p className="text-sm text-muted-foreground">Automate workflows with n8n</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium">Email (Gmail)</p>
                  <p className="text-sm text-muted-foreground">Send emails via Gmail API</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-sm text-muted-foreground">Sync calendar events</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">API Configuration</CardTitle>
            <CardDescription>Configure webhook endpoints for automation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">n8n Webhook URL</label>
              <Input placeholder="https://your-n8n-instance.com/webhook/..." />
              <p className="text-xs text-muted-foreground mt-1">
                Used for lead capture and automation triggers
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Meta Lead Ads Webhook</label>
              <Input placeholder="Webhook URL for Meta Lead Ads" disabled />
              <p className="text-xs text-muted-foreground mt-1">
                Configure in your Meta Business Manager
              </p>
            </div>
            <Button>Save Configuration</Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Adwood CRM</strong> v2.0.0</p>
              <p className="text-muted-foreground">
                A custom CRM built for Adwood Consulting. Designed to replace GoHighLevel
                with a more cost-effective, controllable solution.
              </p>
              <p className="text-muted-foreground">
                Built with React, TypeScript, Tailwind CSS, Supabase, and deployed on Railway.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
