import { Link } from 'react-router-dom'
import { effectiveStatus, formatDue, PRIORITIES, STATUS_META } from '@/lib/tasks'
import { cn } from '@/lib/utils'
import type { Category, Task } from '@/types/database'

export function TaskCard({
  task,
  assigneeName,
  category,
  to,
}: {
  task: Task
  assigneeName: string | null
  category: Category | undefined
  to: string
}) {
  const status = effectiveStatus(task)
  const meta = STATUS_META[status]
  const due = formatDue(task.due_at)
  const priority = PRIORITIES.find((p) => p.value === task.priority)!
  const isDone = task.status === 'completed' || task.status === 'cancelled'

  return (
    <Link
      to={to}
      className="bg-card hover:bg-accent flex items-start gap-3 rounded-2xl border p-4 transition-colors"
    >
      <span className={cn('mt-1.5 size-2.5 shrink-0 rounded-full', meta.className)} />

      <span className="min-w-0 flex-1">
        <span className={cn('block font-medium', isDone && 'text-muted-foreground line-through')}>
          {category?.icon && <span className="mr-1.5">{category.icon}</span>}
          {task.title}
        </span>

        <span className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className={cn(status === 'overdue' && 'text-status-overdue font-medium')}>
            {status === 'completed' ? meta.label : (due ?? meta.label)}
          </span>

          {assigneeName && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{assigneeName}</span>
            </>
          )}

          {task.priority !== 'normal' && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <span className={cn('size-1.5 rounded-full', priority.className)} />
                {priority.label}
              </span>
            </>
          )}
        </span>
      </span>
    </Link>
  )
}
