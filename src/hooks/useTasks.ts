import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import {
  createTask,
  deleteTask,
  getTask,
  handOffTask,
  listCategories,
  listTasks,
  setTaskStatus,
  updateTask,
  type TaskInput,
} from '@/services/tasks'
import type { TaskStatus } from '@/types/database'

export function useTasks(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', workspaceId],
    queryFn: () => listTasks(workspaceId!),
    enabled: Boolean(workspaceId),
  })
}

export function useTask(taskId: string | undefined) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId!),
    enabled: Boolean(taskId),
  })
}

export function useCategories(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['categories', workspaceId],
    queryFn: () => listCategories(workspaceId!),
    enabled: Boolean(workspaceId),
  })
}

export function useCreateTask(workspaceId: string) {
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: TaskInput) => createTask(workspaceId, userId!, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] }),
  })
}

export function useUpdateTask(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: TaskInput }) =>
      updateTask(taskId, input),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['task', task.id] })
    },
  })
}

export function useSetTaskStatus(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      setTaskStatus(taskId, status),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['task', task.id] })
    },
  })
}

export function useHandOffTask(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      handOffTask(taskId, userId),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['task', task.id] })
    },
  })
}

export function useDeleteTask(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] }),
  })
}
