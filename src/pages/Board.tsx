import { ArrowLeft } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { useWorkspaceRealtime } from '@/hooks/useRealtime'
import { useCategories, useSetTaskStatus, useTasks } from '@/hooks/useTasks'
import { useMembers, useWorkspace } from '@/hooks/useWorkspaces'
import { effectiveStatus, STATUS_META } from '@/lib/tasks'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types/database'

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'Не начато' },
  { status: 'in_progress', label: 'В процессе' },
  { status: 'completed', label: 'Выполнено' },
]

type Dragging = { task: Task; x: number; y: number }

export default function Board() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const workspace = useWorkspace(workspaceId)
  const members = useMembers(workspaceId)
  const categories = useCategories(workspaceId)
  const tasks = useTasks(workspaceId)
  const setStatus = useSetTaskStatus(workspaceId!)

  // Состояние перетаскивания дублируется в ref: быстрый бросок успевает
  // отпустить палец раньше, чем React перерисуется, и setState ещё пуст
  const dragRef = useRef<Task | null>(null)
  const [dragging, setDragging] = useState<Dragging | null>(null)
  const [hovered, setHovered] = useState<TaskStatus | null>(null)
  const columnRefs = useRef(new Map<TaskStatus, HTMLElement>())

  useWorkspaceRealtime(workspaceId)

  if (workspace.isSuccess && !workspace.data) {
    return <Navigate to="/" replace />
  }

  const nameByUser = new Map(members.data?.map((m) => [m.userId, m.displayName]))

  function columnUnder(x: number, y: number): TaskStatus | null {
    for (const [status, element] of columnRefs.current) {
      const box = element.getBoundingClientRect()
      if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) return status
    }
    return null
  }

  // Слушатели вешаются на окно, а не на карточку: палец уходит за её пределы
  // сразу же, и полагаться на захват указателя ненадёжно
  function startDrag(event: React.PointerEvent, task: Task) {
    if (task.status === 'cancelled') return

    dragRef.current = task
    setDragging({ task, x: event.clientX, y: event.clientY })

    const onMove = (moveEvent: PointerEvent) => {
      setDragging({ task, x: moveEvent.clientX, y: moveEvent.clientY })
      setHovered(columnUnder(moveEvent.clientX, moveEvent.clientY))
    }

    const onUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)

      const target = columnUnder(upEvent.clientX, upEvent.clientY)
      if (target && target !== task.status) {
        setStatus.mutate({ taskId: task.id, status: target })
      }

      dragRef.current = null
      setDragging(null)
      setHovered(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  return (
    <>
      <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-6 px-5 py-8 pb-24 sm:pb-8">
        <Link
          to={`/w/${workspaceId}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" />
          {workspace.data?.name ?? 'Назад'}
        </Link>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Доска</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Перетащите карточку в другой столбец, чтобы сменить статус
          </p>
        </div>

        {tasks.isPending && <div className="bg-muted h-40 animate-pulse rounded-2xl" />}

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {COLUMNS.map((column) => {
            const columnTasks = (tasks.data ?? []).filter((task) => task.status === column.status)

            return (
              <section
                key={column.status}
                ref={(element) => {
                  if (element) columnRefs.current.set(column.status, element)
                  else columnRefs.current.delete(column.status)
                }}
                className={cn(
                  'flex min-h-40 flex-col gap-2 rounded-2xl border p-2 transition-colors',
                  hovered === column.status && dragging?.task.status !== column.status
                    ? 'border-primary bg-accent'
                    : 'bg-card/50',
                )}
              >
                <h2 className="text-muted-foreground flex items-center gap-1.5 px-1 text-xs font-medium">
                  <span
                    className={cn('size-2 rounded-full', STATUS_META[column.status].className)}
                  />
                  <span className="truncate">{column.label}</span>
                  <span className="ml-auto">{columnTasks.length}</span>
                </h2>

                {columnTasks.map((task) => {
                  const status = effectiveStatus(task)
                  const category = categories.data?.find((c) => c.id === task.category_id)
                  const isDragged = dragging?.task.id === task.id

                  return (
                    <article
                      key={task.id}
                      onPointerDown={(event) => startDrag(event, task)}
                      style={{ touchAction: 'none' }}
                      className={cn(
                        'bg-card cursor-grab rounded-xl border p-2.5 text-sm select-none active:cursor-grabbing',
                        isDragged && 'opacity-40',
                      )}
                    >
                      <span className="flex items-start gap-1.5">
                        <span
                          className={cn(
                            'mt-1 size-2 shrink-0 rounded-full',
                            STATUS_META[status].className,
                          )}
                        />
                        <span className="min-w-0">
                          <span className="block leading-snug break-words">
                            {category?.icon && <span className="mr-1">{category.icon}</span>}
                            {task.title}
                          </span>
                          {task.assigned_to && (
                            <span className="text-muted-foreground block truncate text-xs">
                              {nameByUser.get(task.assigned_to)}
                            </span>
                          )}
                        </span>
                      </span>
                    </article>
                  )
                })}
              </section>
            )
          })}
        </div>
      </main>

      {dragging && (
        <div
          className="bg-card pointer-events-none fixed z-50 max-w-44 rounded-xl border px-2.5 py-2 text-sm shadow-xl"
          style={{ left: dragging.x + 12, top: dragging.y - 12 }}
        >
          {dragging.task.title}
        </div>
      )}

      <BottomNav workspaceId={workspaceId} />
    </>
  )
}
