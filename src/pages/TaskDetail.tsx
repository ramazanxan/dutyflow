import { ArrowLeft, Check, Pencil, Play, Star, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ConfirmDialog, type ConfirmRequest } from '@/components/ui/confirm-dialog'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspaceRealtime } from '@/hooks/useRealtime'
import { useTaskPoints } from '@/hooks/useStats'
import { useCategories, useDeleteTask, useSetTaskStatus, useTask } from '@/hooks/useTasks'
import { useMembers } from '@/hooks/useWorkspaces'
import {
  effectiveStatus,
  formatDue,
  pointsReasonLabel,
  PRIORITIES,
  reminderLabel,
  STATUS_META,
} from '@/lib/tasks'
import { cn } from '@/lib/utils'

export default function TaskDetail() {
  const { workspaceId, taskId } = useParams<{ workspaceId: string; taskId: string }>()
  const navigate = useNavigate()
  const { userId } = useAuth()

  const task = useTask(taskId)
  const members = useMembers(workspaceId)
  const categories = useCategories(workspaceId)
  const setStatus = useSetTaskStatus(workspaceId!)
  const deleteTask = useDeleteTask(workspaceId!)
  const points = useTaskPoints(taskId)
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)

  useWorkspaceRealtime(workspaceId)

  if (task.isPending) {
    return (
      <main className="mx-auto w-full max-w-md px-5 py-8">
        <div className="bg-muted h-40 animate-pulse rounded-2xl" />
      </main>
    )
  }

  if (!task.data) {
    return <Navigate to={`/w/${workspaceId}`} replace />
  }

  const current = task.data
  const status = effectiveStatus(current)
  const meta = STATUS_META[status]
  const priority = PRIORITIES.find((p) => p.value === current.priority)!
  const category = categories.data?.find((c) => c.id === current.category_id)
  const assignee = members.data?.find((m) => m.userId === current.assigned_to)
  const author = members.data?.find((m) => m.userId === current.created_by)

  const me = members.data?.find((m) => m.userId === userId)
  const canManage =
    me?.role === 'owner' || me?.role === 'admin' || current.created_by === userId
  const canComplete = canManage || current.assigned_to === userId
  const isOpen = current.status === 'todo' || current.status === 'in_progress'

  const askComplete = () =>
    setConfirmRequest({
      title: 'Выполнить обязанность?',
      description: current.title,
      confirmLabel: 'Подтвердить',
      onConfirm: () => setStatus.mutate({ taskId: current.id, status: 'completed' }),
    })

  const askCancel = () =>
    setConfirmRequest({
      title: 'Отменить обязанность?',
      description: 'Она перестанет быть активной, но останется в списке.',
      confirmLabel: 'Отменить',
      onConfirm: () => setStatus.mutate({ taskId: current.id, status: 'cancelled' }),
    })

  const askDelete = () =>
    setConfirmRequest({
      title: 'Удалить обязанность?',
      description: 'Это действие нельзя отменить.',
      confirmLabel: 'Удалить',
      destructive: true,
      onConfirm: async () => {
        await deleteTask.mutateAsync(current.id)
        navigate(`/w/${workspaceId}`)
      },
    })

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 py-8">
      <Link
        to={`/w/${workspaceId}`}
        className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        К обязанностям
      </Link>

      <header className="flex flex-col gap-3">
        <span className="flex items-center gap-2 text-sm">
          <span className={cn('size-2.5 rounded-full', meta.className)} />
          <span className={cn(status === 'overdue' && 'text-status-overdue font-medium')}>
            {meta.label}
          </span>
        </span>

        <h1 className="text-2xl font-semibold tracking-tight">
          {category?.icon && <span className="mr-2">{category.icon}</span>}
          {current.title}
        </h1>

        {current.description && (
          <p className="text-muted-foreground whitespace-pre-line">{current.description}</p>
        )}
      </header>

      <dl className="bg-card flex flex-col gap-3 rounded-2xl border p-4 text-sm">
        <Row label="Ответственный" value={assignee?.displayName ?? 'Не назначен'} />
        <Row label="Срок" value={formatDue(current.due_at) ?? 'Без срока'} />
        <Row
          label="Приоритет"
          value={
            <span className="inline-flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', priority.className)} />
              {priority.label}
            </span>
          }
        />
        {category && <Row label="Категория" value={`${category.icon ?? ''} ${category.name}`} />}
        {current.due_at && current.reminder_minutes !== null && (
          <Row label="Напоминание" value={reminderLabel(current.reminder_minutes)} />
        )}
        {current.completed_at && (
          <Row
            label="Выполнено"
            value={new Date(current.completed_at).toLocaleString('ru-RU', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        )}
        {author && <Row label="Создал" value={author.displayName} />}
      </dl>

      {points.data && points.data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {points.data.map((transaction) => (
            <li
              key={transaction.id}
              className="bg-card flex items-center justify-between gap-4 rounded-2xl border p-4 text-sm"
            >
              <span className="flex items-center gap-2">
                <Star className="text-priority-high size-4" />
                {pointsReasonLabel(transaction.reason)}
              </span>
              <span
                className={cn(
                  'font-medium',
                  transaction.amount >= 0 ? 'text-status-done' : 'text-status-overdue',
                )}
              >
                {transaction.amount > 0 ? '+' : ''}
                {transaction.amount} XP
              </span>
            </li>
          ))}
        </ul>
      )}

      {isOpen && (
        <div className="flex flex-col gap-2">
          {canComplete && (
            <Button size="lg" onClick={askComplete} disabled={setStatus.isPending}>
              <Check className="size-5" />
              Выполнить
            </Button>
          )}

          {canComplete && current.status === 'todo' && (
            <Button
              variant="secondary"
              onClick={() => setStatus.mutate({ taskId: current.id, status: 'in_progress' })}
              disabled={setStatus.isPending}
            >
              <Play className="size-4" />
              Взять в работу
            </Button>
          )}
        </div>
      )}

      {!isOpen && canManage && (
        <Button
          variant="secondary"
          onClick={() => setStatus.mutate({ taskId: current.id, status: 'todo' })}
          disabled={setStatus.isPending}
        >
          Вернуть в работу
        </Button>
      )}

      {canManage && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <Link
            to={`/w/${workspaceId}/task/${current.id}/edit`}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 py-2 text-sm"
          >
            <Pencil className="size-4" />
            Изменить
          </Link>

          {isOpen && (
            <button
              onClick={askCancel}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 py-2 text-sm"
            >
              <X className="size-4" />
              Отменить обязанность
            </button>
          )}

          <button
            onClick={askDelete}
            className="text-destructive flex items-center gap-2 py-2 text-sm hover:opacity-80"
          >
            <Trash2 className="size-4" />
            Удалить
          </button>
        </div>
      )}

      <ConfirmDialog request={confirmRequest} onCancel={() => setConfirmRequest(null)} />
    </main>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
