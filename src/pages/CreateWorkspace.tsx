import { ArrowLeft, PartyPopper } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { InviteCard } from '@/components/workspace/InviteCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateWorkspace } from '@/hooks/useWorkspaces'
import { WORKSPACE_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Workspace, WorkspaceCategory } from '@/types/database'

export default function CreateWorkspace() {
  const navigate = useNavigate()
  const createWorkspace = useCreateWorkspace()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<WorkspaceCategory>('home')
  const [created, setCreated] = useState<Workspace | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || createWorkspace.isPending) return

    const workspace = await createWorkspace.mutateAsync({ name, description, category })
    setCreated(workspace)
  }

  if (created) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <PartyPopper className="text-primary size-12" />
          <h1 className="text-2xl font-semibold tracking-tight">Группа создана!</h1>
          <p className="text-muted-foreground">{created.name}</p>
        </div>

        <InviteCard code={created.invite_code} />

        <p className="text-muted-foreground text-center text-sm text-balance">
          Отправьте код или ссылку тем, кого хотите пригласить — регистрация им не понадобится
        </p>

        <Button size="lg" onClick={() => navigate(`/w/${created.id}`)}>
          Перейти в группу
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 py-8">
      <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm">
        <ArrowLeft className="size-4" />
        Назад
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Создать группу</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium">
            Название
          </label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Наша квартира"
            maxLength={60}
            autoFocus
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
            placeholder="Обязанности нашей квартиры"
            maxLength={200}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Категория</legend>
          <div className="grid grid-cols-2 gap-2">
            {WORKSPACE_CATEGORIES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border p-3 text-sm transition-colors',
                  category === option.value
                    ? 'border-primary bg-accent font-medium'
                    : 'bg-card hover:bg-accent',
                )}
              >
                <span className="text-xl">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        {createWorkspace.isError && (
          <p className="text-destructive text-sm">
            Не удалось создать группу. Проверьте интернет и попробуйте ещё раз.
          </p>
        )}

        <Button type="submit" size="lg" disabled={!name.trim() || createWorkspace.isPending}>
          {createWorkspace.isPending ? 'Создаём…' : 'Создать группу'}
        </Button>
      </form>
    </main>
  )
}
