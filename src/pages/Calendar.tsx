import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { TaskCard } from '@/components/tasks/TaskCard'
import { Button } from '@/components/ui/button'
import { useWorkspaceRealtime } from '@/hooks/useRealtime'
import { useCategories, useTasks } from '@/hooks/useTasks'
import { useMembers, useWorkspace } from '@/hooks/useWorkspaces'
import { effectiveStatus, STATUS_META } from '@/lib/tasks'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/database'

const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export default function Calendar() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const workspace = useWorkspace(workspaceId)
  const members = useMembers(workspaceId)
  const categories = useCategories(workspaceId)
  const tasks = useTasks(workspaceId)

  const today = new Date()
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<Date>(today)

  useWorkspaceRealtime(workspaceId)

  if (workspace.isSuccess && !workspace.data) {
    return <Navigate to="/" replace />
  }

  const byDay = new Map<string, Task[]>()
  for (const task of tasks.data ?? []) {
    if (!task.due_at) continue
    const key = dayKey(new Date(task.due_at))
    byDay.set(key, [...(byDay.get(key) ?? []), task])
  }

  // В неделе понедельник первый, а getDay() считает воскресенье нулём
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const leadingBlanks = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()

  const cells: (Date | null)[] = [
    ...Array<null>(leadingBlanks).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1),
    ),
  ]

  const selectedTasks = byDay.get(dayKey(selected)) ?? []
  const nameByUser = new Map(members.data?.map((m) => [m.userId, m.displayName]))

  function shiftMonth(delta: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  }

  return (
    <>
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-5 py-8 pb-24 sm:pb-8">
      <Link
        to={`/w/${workspaceId}`}
        className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        {workspace.data?.name ?? 'Назад'}
      </Link>

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)} aria-label="Предыдущий месяц">
          <ChevronLeft className="size-5" />
        </Button>

        <h1 className="text-lg font-semibold">
          {MONTHS[month.getMonth()]} {month.getFullYear()}
        </h1>

        <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)} aria-label="Следующий месяц">
          <ChevronRight className="size-5" />
        </Button>
      </div>

      <div className="bg-card rounded-2xl border p-3">
        <div className="text-muted-foreground mb-2 grid grid-cols-7 gap-1 text-center text-xs">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, index) => {
            if (!date) return <span key={`blank-${index}`} />

            const dayTasks = byDay.get(dayKey(date)) ?? []
            const isToday = dayKey(date) === dayKey(today)
            const isSelected = dayKey(date) === dayKey(selected)

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelected(date)}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-sm transition-colors',
                  isSelected ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-accent',
                  !isSelected && isToday && 'text-primary font-semibold',
                )}
              >
                {date.getDate()}

                <span className="flex h-1.5 gap-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <span
                      key={task.id}
                      className={cn(
                        'size-1.5 rounded-full',
                        STATUS_META[effectiveStatus(task)].className,
                      )}
                    />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">
          {selected.getDate()} {MONTHS_GENITIVE[selected.getMonth()]}
        </h2>

        {selectedTasks.length === 0 ? (
          <div className="bg-card flex flex-col items-center gap-2 rounded-2xl border p-8 text-center">
            <CalendarDays className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm">На этот день ничего не запланировано</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {selectedTasks.map((task) => (
              <li key={task.id}>
                <TaskCard
                  task={task}
                  assigneeName={nameByUser.get(task.assigned_to ?? '') ?? null}
                  category={categories.data?.find((c) => c.id === task.category_id)}
                  to={`/w/${workspaceId}/task/${task.id}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>

    <BottomNav workspaceId={workspaceId} />
    </>
  )
}
