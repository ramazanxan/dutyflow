import { ArrowLeft, ChevronRight, ListChecks, Users } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { InviteCard } from '@/components/workspace/InviteCard'
import { useMembers, useWorkspace } from '@/hooks/useWorkspaces'
import { workspaceCategoryIcon } from '@/lib/constants'

export default function WorkspaceDashboard() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const workspace = useWorkspace(workspaceId)
  const members = useMembers(workspaceId)

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

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-5 py-8">
      <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm">
        <ArrowLeft className="size-4" />
        Все группы
      </Link>

      <header className="flex items-center gap-4">
        <span className="bg-secondary flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl">
          {workspaceCategoryIcon(workspace.data.category)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{workspace.data.name}</h1>
          {workspace.data.description && (
            <p className="text-muted-foreground truncate text-sm">{workspace.data.description}</p>
          )}
        </div>
      </header>

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

      <InviteCard code={workspace.data.invite_code} />

      <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border p-8 text-center">
        <ListChecks className="text-muted-foreground size-10" />
        <p className="font-medium">Обязанностей пока нет</p>
        <p className="text-muted-foreground text-sm text-balance">
          Создание задач появится на следующем этапе
        </p>
      </div>
    </main>
  )
}
