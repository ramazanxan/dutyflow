import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  syncTaskNotifications,
} from '@/services/notifications'

export function useNotifications() {
  const { userId } = useAuth()

  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => listNotifications(userId!),
    enabled: Boolean(userId),
  })
}

export function useUnreadCount(): number {
  const { data } = useNotifications()
  return data?.filter((notification) => !notification.is_read).length ?? 0
}

export function useMarkNotificationRead() {
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
  })
}

export function useMarkAllRead() {
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => markAllNotificationsRead(userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
  })
}

// Напоминания и просрочку создаёт база при заходе в группу; повторно
// одно и то же уведомление не появится — мешает уникальный индекс.
export function useSyncTaskNotifications(workspaceId: string | undefined) {
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  const { mutate } = useMutation({
    mutationFn: () => syncTaskNotifications(workspaceId!),
    onSuccess: (created) => {
      if (created > 0) {
        queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      }
    },
  })

  useEffect(() => {
    if (workspaceId) mutate()
  }, [workspaceId, mutate])
}

export function useNotificationsRealtime() {
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}
