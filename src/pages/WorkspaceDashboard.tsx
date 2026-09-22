import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  LayoutTemplate,
  ListChecks,
  Plus,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { TaskCard } from '@/components/tasks/TaskCard'
import { buttonVariants } from '@/components/ui/button'
import { InviteCard } from '@/components/workspace/InviteCard'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspaceRealtime } from '@/hooks/useRealtime'
import { useSyncTaskNotifications } from '@/hooks/useNotifications'
import { useApplyOverduePenalties } from '@/hooks/useStats'
import { useCategories, useTasks } from '@/hooks/useTasks'
import { useMembers, useWorkspace } from '@/hooks/useWorkspaces'
import { workspaceCategoryIcon } from '@/lib/constants'
import { effectiveStatus, isDueToday, isOpen } from '@/lib/tasks'
import { cn } from '@/lib/utils'

export default function WorkspaceDashboard() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { userId } = useAuth()
  const [onlyMine, setOnlyMine] = useState(false)

  const workspace = useWorkspace(workspaceId)
  const members = useMembers(workspaceId)
  const categories = useCategories(workspaceId)
  const tasks = useTasks(workspaceId)

  useWorkspaceRealtime(workspaceId)
  useApplyOverduePenalties(workspaceId)
  useSyncTaskNotifications(workspaceId)

  if (workspace.isPending) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-8">
        <div className="bg-muted h-40 animate-pulse rounded-2xl" />
      </main>
    )
  }

  if (!workspace.data) {
    return <Navigate to="/" replace />
  }

  const all = tasks.data ?? []
  const overdueCount = all.filter((task) => effectiveStatus(task) === 'overdue').length
  const todayCount = all.filter((task) => isOpen(task) && isDueToday(task)).length
  const doneCount = all.filter((task) => task.status === 'completed').length

  const visible = onlyMine ? all.filter((task) => task.assigned_to === userId) : all
  const open = visible.filter(isOpen)
  const closed = visible.filter((task) => !isOpen(task))

  const nameByUser = new Map(members.data?.map((m) => [m.userId, m.displayName]))

  return (
    <>
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-5 py-8 pb-24 sm:pb-8">
      <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm">
        <ArrowLeft className="size-4" />
        Все группы
      </Link>

      <header className="flex items-center gap-4">
        <span className="bg-secondary flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl">
          {workspaceCategoryIcon(workspace.data.category)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{workspace.data.name}</h1>
          {workspace.data.description && (
            <p className="text-muted-foreground truncate text-sm">{workspace.data.description}</p>
          )}
        </div>

        <NotificationBell />
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat value={overdueCount} label="Просрочено" dotClassName="bg-status-overdue" />
        <Stat value={todayCount} label="Сегодня" dotClassName="bg-priority-high" />
        <Stat value={doneCount} label="Выполнено" dotClassName="bg-status-done" />
      </div>

      <div className="flex flex-col gap-3">
        <Link
          to={`/w/${workspace.data.id}/members`}
          className="bg-card hover:bg-accent flex items-center gap-4 rounded-2xl border p-4 transition-colors"
        >
          <Users className="text-muted-foreground size-5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block font-medium">Участники</span>
            <span className="text-muted-foreground block truncate text-sm">
              {members.data ? members.data.map((m) => m.displayName).join(', ') : 'Загрузка…'}
            </span>
          </span>
          <ChevronRight className="text-muted-foreground size-5 shrink-0" />
        </Link>

        <Link
          to={`/w/${workspace.data.id}/calendar`}
          className="bg-card hover:bg-accent flex items-center gap-4 rounded-2xl border p-4 transition-colors"
        >
          <CalendarDays className="text-muted-foreground size-5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block font-medium">Календарь</span>
            <span className="text-muted-foreground block truncate text-sm">
              Обязанности по датам
            </span>
          </span>
          <ChevronRight className="text-muted-foreground size-5 shrink-0" />
        </Link>

        <Link
          to={`/w/${workspace.data.id}/templates`}
          className="bg-card hover:bg-accent flex items-center gap-4 rounded-2xl border p-4 transition-colors"
        >
          <LayoutTemplate className="text-muted-foreground size-5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block font-medium">Шаблоны</span>
            <span className="text-muted-foreground block truncate text-sm">
              Набор обязанностей одной кнопкой
            </span>
          </span>
          <ChevronRight className="text-muted-foreground size-5 shrink-0" />
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Обязанности</h2>

          <div className="bg-secondary flex rounded-lg p-0.5 text-sm">
            <button
              onClick={() => setOnlyMine(false)}
              className={cn('rounded-md px-3 py-1', !onlyMine && 'bg-card font-medium shadow-sm')}
            >
              Все
            </button>
            <button
              onClick={() => setOnlyMine(true)}
              className={cn('rounded-md px-3 py-1', onlyMine && 'bg-card font-medium shadow-sm')}
            >
              Мои
            </button>
          </div>
        </div>

        {tasks.isPending && <div className="bg-muted h-20 animate-pulse rounded-2xl" />}

        {tasks.isError && (
          <p className="text-destructive text-sm">Не удалось загрузить обязанности.</p>
        )}

        {tasks.isSuccess && visible.length === 0 && (
          <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border p-8 text-center">
            <ListChecks className="text-muted-foreground size-10" />
            <p className="font-medium">
              {onlyMine ? 'На вас пока ничего не назначено' : 'Пока нет обязанностей'}
            </p>
            {!onlyMine && (
              <p className="text-muted-foreground text-sm text-balance">
                Создайте первую обязанность и назначьте ответственного
              </p>
            )}
          </div>
        )}

        {open.length > 0 && (
          <ul className="flex flex-col gap-3">
            {open.map((task) => (
              <li key={task.id}>
                <TaskCard
                  task={task}
                  assigneeName={nameByUser.get(task.assigned_to ?? '') ?? null}
                  category={categories.data?.find((c) => c.id === task.category_id)}
                  to={`/w/${workspace.data!.id}/task/${task.id}`}
                />
              </li>
            ))}
          </ul>
        )}

        {closed.length > 0 && (
          <>
            <h3 className="text-muted-foreground mt-2 text-sm font-medium">Завершённые</h3>
            <ul className="flex flex-col gap-3">
              {closed.map((task) => (
                <li key={task.id}>
                  <TaskCard
                    task={task}
                    assigneeName={nameByUser.get(task.assigned_to ?? '') ?? null}
                    category={categories.data?.find((c) => c.id === task.category_id)}
                    to={`/w/${workspace.data!.id}/task/${task.id}`}
                  />
                </li>
              ))}
            </ul>
          </>
        )}

        <Link
          to={`/w/${workspace.data.id}/task/new`}
          className={cn(buttonVariants({ size: 'lg' }), 'mt-2')}
        >
          <Plus className="size-5" />
          Добавить обязанность
        </Link>
      </section>

      <InviteCard code={workspace.data.invite_code} />
    </main>

    <BottomNav workspaceId={workspace.data.id} />
    </>
  )
}

function Stat({
  value,
  label,
  dotClassName,
}: {
  value: number
  label: string
  dotClassName: string
}) {
  return (
    <div className="bg-card flex flex-col items-center gap-1 rounded-2xl border p-4">
      <span className="flex items-center gap-1.5">
        <span className={cn('size-2 rounded-full', dotClassName)} />
        <span className="text-2xl font-semibold">{value}</span>
      </span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  )
}
