import { supabase } from '@/lib/supabase'
import type { TaskPriority, TaskTemplate, TemplateTask } from '@/types/database'

export type TemplateWithTasks = TaskTemplate & { tasks: TemplateTask[] }

export type TemplateDraft = {
  name: string
  icon: string | null
  titles: string[]
}

export async function listTemplates(workspaceId: string): Promise<TemplateWithTasks[]> {
  const { data: templates, error } = await supabase
    .from('task_templates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at')

  if (error) throw error
  if (!templates.length) return []

  const { data: items, error: itemsError } = await supabase
    .from('template_tasks')
    .select('*')
    .in(
      'template_id',
      templates.map((template) => template.id),
    )
    .order('position')

  if (itemsError) throw itemsError

  return templates.map((template) => ({
    ...template,
    tasks: items.filter((item: TemplateTask) => item.template_id === template.id),
  }))
}

export async function createTemplate(
  workspaceId: string,
  createdBy: string,
  draft: TemplateDraft,
): Promise<void> {
  const { data: template, error } = await supabase
    .from('task_templates')
    .insert({
      workspace_id: workspaceId,
      created_by: createdBy,
      name: draft.name.trim(),
      icon: draft.icon,
    })
    .select()
    .single()

  if (error) throw error

  const titles = draft.titles.map((title) => title.trim()).filter(Boolean)
  if (!titles.length) return

  const { error: itemsError } = await supabase.from('template_tasks').insert(
    titles.map((title, index) => ({
      template_id: template.id,
      title,
      position: index,
    })),
  )

  if (itemsError) throw itemsError
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const { error } = await supabase.from('task_templates').delete().eq('id', templateId)
  if (error) throw error
}

// Задачи создаются без срока и исполнителя — их назначают уже на месте
export async function applyTemplate(
  template: TemplateWithTasks,
  createdBy: string,
): Promise<number> {
  if (!template.tasks.length) return 0

  const { error } = await supabase.from('tasks').insert(
    template.tasks.map((item) => ({
      workspace_id: template.workspace_id,
      created_by: createdBy,
      title: item.title,
      category_id: item.category_id,
      priority: item.priority as TaskPriority,
    })),
  )

  if (error) throw error
  return template.tasks.length
}
