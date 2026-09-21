import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changeMemberRole,
  createWorkspace,
  getWorkspace,
  joinWorkspace,
  listMembers,
  listMyWorkspaces,
  removeMember,
} from '@/services/workspaces'
import { useAuth } from '@/hooks/useAuth'
import type { MemberRole, WorkspaceCategory } from '@/types/database'

export function useMyWorkspaces() {
  const { userId } = useAuth()

  return useQuery({
    queryKey: ['workspaces', userId],
    queryFn: () => listMyWorkspaces(userId!),
    enabled: Boolean(userId),
  })
}

export function useWorkspace(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => getWorkspace(workspaceId!),
    enabled: Boolean(workspaceId),
  })
}

export function useMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => listMembers(workspaceId!),
    enabled: Boolean(workspaceId),
  })
}

export function useCreateWorkspace() {
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { name: string; description: string; category: WorkspaceCategory }) =>
      createWorkspace({ ...input, ownerId: userId! }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

export function useJoinWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) => joinWorkspace(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

export function useChangeMemberRole(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: MemberRole }) =>
      changeMemberRole(memberId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members', workspaceId] }),
  })
}

export function useRemoveMember(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: string) => removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}
