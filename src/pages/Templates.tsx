import { ArrowLeft, LayoutTemplate, Plus, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { Button } from '@/components/ui/button'
import { ConfirmDialog, type ConfirmRequest } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import {
  useApplyTemplate,
  useCreateTemplate,
  useDeleteTemplate,
  useTemplates,
} from '@/hooks/useTemplates'
import { useWorkspace } from '@/hooks/useWorkspaces'
import type { TemplateWithTasks } from '@/services/templates'

const ICONS = ['🏠', '🧹', '🍳', '🗑️', '🛒', '🔧', '💼', '📚', '📦']

export default function Templates() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const workspace = useWorkspace(workspaceId)
  const templates = useTemplates(workspaceId)
  const createTemplate = useCreateTemplate(workspaceId!)
  const deleteTemplate = useDeleteTemplate(workspaceId!)
  const applyTemplate = useApplyTemplate(workspaceId!)

  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🏠')
  const [titles, setTitles] = useState<string[]>([''])
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)

  if (workspace.isSuccess && !workspace.data) {
    return <Navigate to="/" replace />
  }

  const filledTitles = titles.filter((title) => title.trim())

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !filledTitles.length || createTemplate.isPending) return

    await createTemplate.mutateAsync({ name, icon, titles })
    setName('')
    setIcon('🏠')
    setTitles([''])
    setIsCreating(false)
  }

  function askApply(template: TemplateWithTasks) {
    setConfirmRequest({
      title: `Создать ${template.tasks.length} ${taskWord(template.tasks.length)}?`,
      description: 'Обязанности появятся без срока и ответственного — назначите их потом.',
      confirmLabel: 'Создать',
      onConfirm: async () => {
        await applyTemplate.mutateAsync(template)
        navigate(`/w/${workspaceId}`)
      },
    })
  }

  function askDelete(template: TemplateWithTasks) {
    setConfirmRequest({
      title: `Удалить шаблон «${template.name}»?`,
      description: 'Уже созданные обязанности останутся на месте.',
      confirmLabel: 'Удалить',
      destructive: true,
      onConfirm: () => deleteTemplate.mutate(template.id),
    })
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

        <h1 className="text-2xl font-semibold tracking-tight">Шаблоны</h1>

        {templates.isPending && <div className="bg-muted h-24 animate-pulse rounded-2xl" />}

        {templates.isSuccess && templates.data.length === 0 && !isCreating && (
          <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border p-8 text-center">
            <LayoutTemplate className="text-muted-foreground size-10" />
            <p className="font-medium">Шаблонов пока нет</p>
            <p className="text-muted-foreground text-sm text-balance">
              Соберите набор обязанностей, которые повторяются вместе — например, генеральную
              уборку — и создавайте их одной кнопкой
            </p>
          </div>
        )}

        {templates.data && templates.data.length > 0 && (
          <ul className="flex flex-col gap-3">
            {templates.data.map((template) => (
              <li key={template.id} className="bg-card rounded-2xl border p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{template.icon}</span>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{template.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {template.tasks.map((item) => item.title).join(' · ')}
                    </p>
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => askDelete(template)}>
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </div>

                <Button
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={() => askApply(template)}
                  disabled={!template.tasks.length || applyTemplate.isPending}
                >
                  <Plus className="size-4" />
                  Создать обязанности
                </Button>
              </li>
            ))}
          </ul>
        )}

        {isCreating ? (
          <form onSubmit={handleCreate} className="bg-card flex flex-col gap-4 rounded-2xl border p-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="template-name" className="text-sm font-medium">
                Название шаблона
              </label>
              <Input
                id="template-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Уборка квартиры"
                maxLength={60}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Значок</span>
              <div className="flex flex-wrap gap-2">
                {ICONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setIcon(option)}
                    className={`flex size-10 items-center justify-center rounded-xl border text-xl transition-colors ${
                      icon === option ? 'border-primary bg-accent' : 'hover:bg-accent'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Обязанности</span>

              {titles.map((title, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={title}
                    onChange={(event) =>
                      setTitles((current) =>
                        current.map((value, i) => (i === index ? event.target.value : value)),
                      )
                    }
                    placeholder="Помыть пол"
                    maxLength={120}
                    aria-label={`Обязанность ${index + 1}`}
                  />
                  {titles.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setTitles((current) => current.filter((_, i) => i !== index))}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="ghost"
                className="self-start"
                onClick={() => setTitles((current) => [...current, ''])}
              >
                <Plus className="size-4" />
                Ещё одна
              </Button>
            </div>

            {createTemplate.isError && (
              <p className="text-destructive text-sm">Не удалось сохранить шаблон.</p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setIsCreating(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!name.trim() || !filledTitles.length || createTemplate.isPending}
              >
                {createTemplate.isPending ? 'Сохраняем…' : 'Сохранить'}
              </Button>
            </div>
          </form>
        ) : (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="size-4" />
            Новый шаблон
          </Button>
        )}
      </main>

      <BottomNav workspaceId={workspaceId} />
      <ConfirmDialog request={confirmRequest} onCancel={() => setConfirmRequest(null)} />
    </>
  )
}

function taskWord(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) return 'обязанность'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'обязанности'
  return 'обязанностей'
}
