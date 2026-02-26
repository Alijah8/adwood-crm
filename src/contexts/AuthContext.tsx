import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types/auth'
import { useCRMStore } from '../store'

interface AuthContextType {
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  clearError: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const WARNING_BEFORE = 5 * 60 * 1000 // 5 minutes before logout

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user profile from profiles table
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return null
    }

    // Check if user is active
    if (data && !data.is_active) {
      await supabase.auth.signOut()
      setError('Your account has been deactivated. Contact your administrator.')
      return null
    }

    return data as UserProfile
  }, [])

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()

        // If stored session is broken or expired, clear it so login works
        if (sessionError || (currentSession && !currentSession.user)) {
          await supabase.auth.signOut().catch(() => {})
          setSession(null)
          return
        }

        if (currentSession?.user) {
          // Validate the session is actually usable by fetching profile
          const userProfile = await fetchProfile(currentSession.user.id)
          if (!userProfile) {
            // Session exists but is stale/invalid — clear it
            await supabase.auth.signOut().catch(() => {})
            setSession(null)
            return
          }
          setSession(currentSession)
          setProfile(userProfile)
          useCRMStore.getState().fetchAll()
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        // Clear any broken session state so login page shows cleanly
        await supabase.auth.signOut().catch(() => {})
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)

        if (event === 'SIGNED_IN' && newSession?.user) {
          const userProfile = await fetchProfile(newSession.user.id)
          setProfile(userProfile)
          if (userProfile) useCRMStore.getState().fetchAll()
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
        } else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
          // Re-check if user is still active on token refresh
          const userProfile = await fetchProfile(newSession.user.id)
          setProfile(userProfile)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // Inactivity timeout
  useEffect(() => {
    if (!session) return

    let timeoutId: ReturnType<typeof setTimeout>
    let warningId: ReturnType<typeof setTimeout>

    const resetTimer = () => {
      clearTimeout(timeoutId)
      clearTimeout(warningId)

      warningId = setTimeout(() => {
        // Could show a warning toast here
        console.warn('Session will expire in 5 minutes due to inactivity')
      }, INACTIVITY_TIMEOUT - WARNING_BEFORE)

      timeoutId = setTimeout(async () => {
        await supabase.auth.signOut().catch(() => {
          localStorage.removeItem('sb-kddkibsrdgtcorhrtjip-auth-token')
        })
        setSession(null)
        setProfile(null)
        setError('Session expired due to inactivity. Please log in again.')
      }, INACTIVITY_TIMEOUT)
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => window.addEventListener(event, resetTimer))
    resetTimer()

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(warningId)
      events.forEach(event => window.removeEventListener(event, resetTimer))
    }
  }, [session])

  // Multi-tab sync: listen for storage events to sync logout across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sb-kddkibsrdgtcorhrtjip-auth-token' && !e.newValue) {
        // Token was removed in another tab — user logged out
        setSession(null)
        setProfile(null)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    setLoading(true)

    try {
      // Clear any stale session before attempting fresh login
      await supabase.auth.signOut().catch(() => {})

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (loginError) {
        if (loginError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.')
        }
        throw new Error(loginError.message)
      }

      if (data.user) {
        const userProfile = await fetchProfile(data.user.id)
        if (!userProfile) {
          await supabase.auth.signOut()
          throw new Error('Account not found or deactivated. Contact your administrator.')
        }
        setProfile(userProfile)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchProfile])

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } catch (err) {
      // signOut failed (network down, etc.) — remove token manually as fallback
      console.error('Logout error, clearing token manually:', err)
      localStorage.removeItem('sb-kddkibsrdgtcorhrtjip-auth-token')
    } finally {
      setSession(null)
      setProfile(null)
      setError(null)
      setLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    setError(null)
    const redirectUrl = `${import.meta.env.VITE_APP_URL || window.location.origin}/reset-password`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: redirectUrl }
    )

    if (resetError) {
      throw new Error(resetError.message)
    }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    setError(null)
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      throw new Error(updateError.message)
    }
  }, [])

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!profile) return
    setError(null)

    // Only allow updating safe fields (role, is_active, created_by blocked by RLS + here)
    const safeFields: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.name !== undefined) safeFields.name = data.name
    if (data.phone !== undefined) safeFields.phone = data.phone
    if (data.avatar_url !== undefined) safeFields.avatar_url = data.avatar_url

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update(safeFields)
      .eq('id', profile.id)
      .select('*')
      .single()

    if (updateError) {
      throw new Error(updateError.message)
    }

    // Update local profile state from server response (not raw input)
    setProfile(updated as UserProfile)
  }, [profile])

  const clearError = useCallback(() => setError(null), [])

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        error,
        login,
        logout,
        resetPassword,
        updatePassword,
        updateProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
