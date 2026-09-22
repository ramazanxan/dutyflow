import { ArrowLeft } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useCategories, useCreateTask, useTask, useUpdateTask } from '@/hooks/useTasks'
import { useMembers } from '@/hooks/useWorkspaces'
import {
  fromDateTimeLocal,
  PRIORITIES,
  RECURRENCE_OPTIONS,
  recurrenceWeekdays,
  REMINDER_OPTIONS,
  toDateTimeLocal,
  WEEKDAYS,
} from '@/lib/tasks'
import { cn } from '@/lib/utils'
import type { RecurrenceType, TaskPriority } from '@/types/database'

export default function TaskForm() {
  const { workspaceId, taskId } = useParams<{ workspaceId: string; taskId?: string }>()
  const navigate = useNavigate()

  const members = useMembers(workspaceId)
  const categories = useCategories(workspaceId)
  const existing = useTask(taskId)

  const createTask = useCreateTask(workspaceId!)
  const updateTask = useUpdateTask(workspaceId!)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [dueAt, setDueAt] = useState('')
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null)
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none')
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [rotation, setRotation] = useState<string[]>([])

  const nameOf = (userId: string) =>
    members.data?.find((member) => member.userId === userId)?.displayName ?? 'участник'

  const task = existing.data

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setDescription(task.description ?? '')
    setAssignedTo(task.assigned_to ?? '')
    setCategoryId(task.category_id ?? '')
    setPriority(task.priority)
    setDueAt(toDateTimeLocal(task.due_at))
    setReminderMinutes(task.reminder_minutes)
    setRecurrenceType(task.recurrence_type)
    setWeekdays(recurrenceWeekdays(task.recurrence_config))
    setRotation(task.rotation_user_ids)
  }, [task])

  const isEditing = Boolean(taskId)
  const isSaving = createTask.isPending || updateTask.isPending
  const failed = createTask.isError || updateTask.isError

  if (isEditing && existing.isSuccess && !existing.data) {
    return <Navigate to={`/w/${workspaceId}`} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || isSaving) return

    // Дежурство начинается с первого в очереди, иначе первый повтор
    // достался бы случайному человеку
    const useRotation = Boolean(dueAt) && recurrenceType !== 'none' && rotation.length > 0
    const firstAssignee =
      useRotation && !rotation.includes(assignedTo) ? rotation[0] : assignedTo || null

    const input = {
      title,
      description,
      assignedTo: firstAssignee,
      categoryId: categoryId || null,
      priority,
      dueAt: fromDateTimeLocal(dueAt),
      reminderMinutes,
      recurrenceType,
      recurrenceWeekdays: weekdays,
      rotationUserIds: rotation,
    }

    if (taskId) {
      await updateTask.mutateAsync({ taskId, input })
      navigate(`/w/${workspaceId}/task/${taskId}`)
    } else {
      const created = await createTask.mutateAsync(input)
      navigate(`/w/${workspaceId}/task/${created.id}`)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 py-8">
      <Link
        to={taskId ? `/w/${workspaceId}/task/${taskId}` : `/w/${workspaceId}`}
        className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        Назад
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">
        {isEditing ? 'Изменить обязанность' : 'Новая обязанность'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="text-sm font-medium">
            Название
          </label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Вынести мусор"
            maxLength={120}
            autoFocus={!isEditing}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-sm font-medium">
            Описание <span className="text-muted-foreground font-normal">— необязательно</span>
          </label>
          <Input
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Вынести мусор до контейнера"
            maxLength={500}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="assignee" className="text-sm font-medium">
            Ответственный
          </label>
          <Select
            id="assignee"
            value={assignedTo}
            onChange={(event) => setAssignedTo(event.target.value)}
          >
            <option value="">Не назначен</option>
            {members.data?.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.displayName}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="text-sm font-medium">
            Категория
          </label>
          <Select
            id="category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Без категории</option>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </Select>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Приоритет</legend>
          <div className="grid grid-cols-2 gap-2">
            {PRIORITIES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPriority(option.value)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border p-3 text-sm transition-colors',
                  priority === option.value
                    ? 'border-primary bg-accent font-medium'
                    : 'bg-card hover:bg-accent',
                )}
              >
                <span className={cn('size-2.5 rounded-full', option.className)} />
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="due" className="text-sm font-medium">
            Срок <span className="text-muted-foreground font-normal">— необязательно</span>
          </label>
          <Input
            id="due"
            type="datetime-local"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
          />
        </div>

        {dueAt && (
          <div className="flex flex-col gap-2">
            <label htmlFor="recurrence" className="text-sm font-medium">
              Повторение
            </label>
            <Select
              id="recurrence"
              value={recurrenceType}
              onChange={(event) => setRecurrenceType(event.target.value as RecurrenceType)}
            >
              {RECURRENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            {recurrenceType === 'custom_weekdays' && (
              <div className="mt-1 flex gap-1.5">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() =>
                      setWeekdays((current) =>
                        current.includes(day.value)
                          ? current.filter((value) => value !== day.value)
                          : [...current, day.value],
                      )
                    }
                    className={cn(
                      'flex-1 rounded-lg border py-2 text-sm transition-colors',
                      weekdays.includes(day.value)
                        ? 'border-primary bg-primary text-primary-foreground font-medium'
                        : 'bg-card hover:bg-accent',
                    )}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            )}

            {recurrenceType === 'custom_weekdays' && weekdays.length === 0 && (
              <p className="text-muted-foreground text-xs">
                Выберите хотя бы один день, иначе задача не повторится
              </p>
            )}
          </div>
        )}

        {dueAt && recurrenceType !== 'none' && (members.data?.length ?? 0) > 1 && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Очередь</legend>

            <p className="text-muted-foreground mb-1 text-xs leading-relaxed">
              Отметьте, кто дежурит по очереди — ответственный будет сменяться при каждом
              повторе. Если никого не отмечать, задача всегда остаётся на одном человеке.
            </p>

            <div className="flex flex-col gap-2">
              {members.data?.map((member) => {
                const index = rotation.indexOf(member.userId)
                const isOn = index !== -1

                return (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() =>
                      setRotation((current) =>
                        current.includes(member.userId)
                          ? current.filter((id) => id !== member.userId)
                          : [...current, member.userId],
                      )
                    }
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 text-sm transition-colors',
                      isOn ? 'border-primary bg-accent' : 'bg-card hover:bg-accent',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                        isOn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground',
                      )}
                    >
                      {isOn ? index + 1 : ''}
                    </span>
                    {member.displayName}
                  </button>
                )
              })}
            </div>

            {rotation.length > 0 && (
              <p className="text-muted-foreground mt-1 text-xs">
                Первым дежурит {nameOf(rotation[0])}, дальше по кругу в этом порядке.
              </p>
            )}
          </fieldset>
        )}

        {dueAt && (
          <div className="flex flex-col gap-2">
            <label htmlFor="reminder" className="text-sm font-medium">
              Напомнить
            </label>
            <Select
              id="reminder"
              value={reminderMinutes === null ? '' : String(reminderMinutes)}
              onChange={(event) =>
                setReminderMinutes(event.target.value ? Number(event.target.value) : null)
              }
            >
              {REMINDER_OPTIONS.map((option) => (
                <option key={option.label} value={option.value === null ? '' : option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        {failed && (
          <p className="text-destructive text-sm">
            Не удалось сохранить обязанность. Проверьте интернет и попробуйте ещё раз.
          </p>
        )}

        <Button type="submit" size="lg" disabled={!title.trim() || isSaving}>
          {isSaving ? 'Сохраняем…' : isEditing ? 'Сохранить' : 'Создать'}
        </Button>
      </form>
    </main>
  )
}
