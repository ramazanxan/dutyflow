import { supabase } from '@/lib/supabase'
import type { Category, Task, TaskPriority, TaskStatus } from '@/types/database'

export type TaskInput = {
  title: string
  description: string
  assignedTo: string | null
  categoryId: string | null
  priority: TaskPriority
  dueAt: string | null
  reminderMinutes: number | null
}

export async function listTasks(workspaceId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getTask(taskId: string): Promise<Task | null> {
  const { data, error } = await supabase.from('tasks').select('*').eq('id', taskId).maybeSingle()

  if (error) throw error
  return data
}

export async function listCategories(workspaceId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at')

  if (error) throw error
  return data
}

export async function createTask(
  workspaceId: string,
  createdBy: string,
  input: TaskInput,
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      workspace_id: workspaceId,
      created_by: createdBy,
      title: input.title.trim(),
      description: input.description.trim() || null,
      assigned_to: input.assignedTo,
      category_id: input.categoryId,
      priority: input.priority,
      due_at: input.dueAt,
      reminder_minutes: input.dueAt ? input.reminderMinutes : null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTask(taskId: string, input: TaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      title: input.title.trim(),
      description: input.description.trim() || null,
      assigned_to: input.assignedTo,
      category_id: input.categoryId,
      priority: input.priority,
      due_at: input.dueAt,
      reminder_minutes: input.dueAt ? input.reminderMinutes : null,
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function setTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
}
