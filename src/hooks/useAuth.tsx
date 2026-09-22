import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

type AuthContextValue = {
  userId: string | null
  profile: Profile | null
  email: string | null
  isAnonymous: boolean
  isLoading: boolean
  saveName: (name: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [profileChecked, setProfileChecked] = useState(false)

  useEffect(() => {
    // onAuthStateChange сразу отдаёт INITIAL_SESSION, поэтому getSession не нужен.
    // Внутри колбэка нельзя await-ить supabase — профиль грузим отдельным эффектом.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
      setEmail(session?.user.email || null)
      setIsAnonymous(session?.user.is_anonymous ?? true)
      setSessionChecked(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!sessionChecked) return

    if (!userId) {
      setProfile(null)
      setProfileChecked(true)
      return
    }

    let active = true
    setProfileChecked(false)

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        setProfile(data)
        setProfileChecked(true)
      })

    return () => {
      active = false
    }
  }, [userId, sessionChecked])

  const saveName = useCallback(
    async (name: string) => {
      let id = userId

      if (!id) {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) throw error
        id = data.user!.id
        setUserId(id)
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id, display_name: name.trim() })
        .select()
        .single()

      if (error) throw error
      setProfile(data)
    },
    [userId],
  )

  return (
    <AuthContext
      value={{
        userId,
        profile,
        email,
        isAnonymous,
        isLoading: !sessionChecked || !profileChecked,
        saveName,
      }}
    >
      {children}
    </AuthContext>
  )
}

export function useAuth() {
  const value = use(AuthContext)
  if (!value) throw new Error('useAuth вызван вне AuthProvider')
  return value
}
