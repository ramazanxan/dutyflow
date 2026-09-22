import { supabase } from '@/lib/supabase'

export type LinkResult = { needsConfirmation: boolean }

// Привязка почты превращает анонимный аккаунт в постоянный: тот же user_id,
// те же группы, но зайти можно с любого устройства.
export async function linkEmail(email: string, password: string): Promise<LinkResult> {
  const { data, error } = await supabase.auth.updateUser({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) throw error

  // Пока почта не подтверждена, Supabase держит адрес в new_email
  return { needsConfirmation: !data.user.email_confirmed_at }
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) throw error
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
