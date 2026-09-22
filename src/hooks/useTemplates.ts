import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import {
  applyTemplate,
  createTemplate,
  deleteTemplate,
  listTemplates,
  type TemplateDraft,
  type TemplateWithTasks,
} from '@/services/templates'

export function useTemplates(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['templates', workspaceId],
    queryFn: () => listTemplates(workspaceId!),
    enabled: Boolean(workspaceId),
  })
}

export function useCreateTemplate(workspaceId: string) {
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (draft: TemplateDraft) => createTemplate(workspaceId, userId!, draft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates', workspaceId] }),
  })
}

export function useDeleteTemplate(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (templateId: string) => deleteTemplate(templateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates', workspaceId] }),
  })
}

export function useApplyTemplate(workspaceId: string) {
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (template: TemplateWithTasks) => applyTemplate(template, userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] }),
  })
}
