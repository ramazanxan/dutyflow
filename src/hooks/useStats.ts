import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  applyOverduePenalties,
  listMemberPoints,
  listTaskPoints,
  loadWorkspaceStats,
} from '@/services/stats'

export function useWorkspaceStats(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['stats', workspaceId],
    queryFn: () => loadWorkspaceStats(workspaceId!),
    enabled: Boolean(workspaceId),
  })
}

export function useTaskPoints(taskId: string | undefined) {
  return useQuery({
    queryKey: ['task-points', taskId],
    queryFn: () => listTaskPoints(taskId!),
    enabled: Boolean(taskId),
  })
}

export function useMemberPoints(workspaceId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['member-points', workspaceId, userId],
    queryFn: () => listMemberPoints(workspaceId!, userId!),
    enabled: Boolean(workspaceId && userId),
  })
}

// Штраф за просрочку начисляется не фоновым процессом, а при заходе в группу.
// Повторно не начислится: в базе стоит уникальный индекс на событие.
export function useApplyOverduePenalties(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => applyOverduePenalties(workspaceId!),
    onSuccess: (applied) => {
      if (applied > 0) {
        queryClient.invalidateQueries({ queryKey: ['stats', workspaceId] })
      }
    },
  })

  const { mutate } = mutation

  useEffect(() => {
    if (workspaceId) mutate()
  }, [workspaceId, mutate])
}
