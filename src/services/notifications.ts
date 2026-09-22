import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types/database'

export async function listNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) throw error
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
}

export async function syncTaskNotifications(workspaceId: string): Promise<number> {
  const { data, error } = await supabase.rpc('sync_task_notifications', {
    _workspace_id: workspaceId,
  })

  if (error) throw error
  return data
}
