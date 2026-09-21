import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Живые обновления внутри группы: любое изменение на другом устройстве
// помечает соответствующий кэш устаревшим, и React Query перезапрашивает данные.
export function useWorkspaceRealtime(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!workspaceId) return

    const channel = supabase
      .channel(`workspace:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] })

          const taskId = (payload.new as { id?: string }).id ?? (payload.old as { id?: string }).id
          if (taskId) queryClient.invalidateQueries({ queryKey: ['task', taskId] })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_members',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['members', workspaceId] })
          queryClient.invalidateQueries({ queryKey: ['workspaces'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, queryClient])
}
