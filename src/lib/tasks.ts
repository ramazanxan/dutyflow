import type { Task, TaskPriority, TaskStatus } from '@/types/database'

export type EffectiveStatus = TaskStatus | 'overdue'

export const PRIORITIES: { value: TaskPriority; label: string; className: string }[] = [
  { value: 'low', label: 'Низкий', className: 'bg-priority-low' },
  { value: 'normal', label: 'Обычный', className: 'bg-priority-normal' },
  { value: 'high', label: 'Высокий', className: 'bg-priority-high' },
  { value: 'urgent', label: 'Срочный', className: 'bg-priority-urgent' },
]

export const STATUS_META: Record<EffectiveStatus, { label: string; className: string }> = {
  todo: { label: 'Не начато', className: 'bg-status-todo' },
  in_progress: { label: 'В процессе', className: 'bg-status-progress' },
  completed: { label: 'Выполнено', className: 'bg-status-done' },
  overdue: { label: 'Просрочено', className: 'bg-status-overdue' },
  cancelled: { label: 'Отменено', className: 'bg-status-cancelled' },
}

export const REMINDER_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Не напоминать' },
  { value: 5, label: 'За 5 минут' },
  { value: 15, label: 'За 15 минут' },
  { value: 30, label: 'За 30 минут' },
  { value: 60, label: 'За 1 час' },
  { value: 180, label: 'За 3 часа' },
  { value: 1440, label: 'За 1 день' },
]

export function reminderLabel(minutes: number | null): string {
  return REMINDER_OPTIONS.find((option) => option.value === minutes)?.label ?? 'Не напоминать'
}

export const POINTS_REASON_LABELS: Record<string, string> = {
  completed: 'Выполнено вовремя',
  completed_early: 'Выполнено раньше срока',
  completed_late: 'Выполнено с опозданием',
  overdue: 'Просрочено',
}

export function pointsReasonLabel(reason: string): string {
  return POINTS_REASON_LABELS[reason] ?? reason
}

// Просрочка не хранится в базе, а выводится из дедлайна — иначе пришлось бы
// держать фоновый процесс, который переписывает статусы.
export function effectiveStatus(task: Task, now = new Date()): EffectiveStatus {
  if (task.status !== 'todo' && task.status !== 'in_progress') return task.status
  if (task.due_at && new Date(task.due_at) < now) return 'overdue'
  return task.status
}

export function isOpen(task: Task): boolean {
  return task.status === 'todo' || task.status === 'in_progress'
}

export function isDueToday(task: Task, now = new Date()): boolean {
  if (!task.due_at) return false
  const due = new Date(task.due_at)
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  )
}

export function priorityLabel(priority: TaskPriority): string {
  return PRIORITIES.find((p) => p.value === priority)?.label ?? 'Обычный'
}

export function formatDue(dueAt: string | null): string | null {
  if (!dueAt) return null

  const due = new Date(dueAt)
  const now = new Date()
  const time = due.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const daysApart = Math.round((startOfDay(due) - startOfDay(now)) / 86_400_000)

  if (daysApart === 0) return `Сегодня · ${time}`
  if (daysApart === 1) return `Завтра · ${time}`
  if (daysApart === -1) return `Вчера · ${time}`

  const date = due.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  return `${date} · ${time}`
}

// <input type="datetime-local"> работает с локальным временем без таймзоны
export function toDateTimeLocal(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromDateTimeLocal(value: string): string | null {
  return value ? new Date(value).toISOString() : null
}
