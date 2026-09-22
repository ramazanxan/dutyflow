import { ChevronRight, LogIn, Plus, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useMyWorkspaces } from '@/hooks/useWorkspaces'
import { ROLE_LABELS, workspaceCategoryIcon } from '@/lib/constants'
import { cn } from '@/lib/utils'

export default function Workspaces() {
  const { profile } = useAuth()
  const { data: workspaces, isPending, isError } = useMyWorkspaces()

  return (
    <>
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-5 py-8 pb-24 sm:pb-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Привет, {profile?.display_name} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Ваши группы</p>
        </div>

        <NotificationBell />
      </header>

      {isPending && <div className="bg-muted h-24 animate-pulse rounded-2xl" />}

      {isError && (
        <p className="text-destructive text-sm">
          Не удалось загрузить группы. Проверьте интернет и обновите страницу.
        </p>
      )}

      {workspaces && workspaces.length === 0 && (
        <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border p-8 text-center">
          <Users className="text-muted-foreground size-10" />
          <p className="font-medium">Пока нет ни одной группы</p>
          <p className="text-muted-foreground text-sm text-balance">
            Создайте свою группу или вступите в существующую по коду приглашения
          </p>
        </div>
      )}

      {workspaces && workspaces.length > 0 && (
        <ul className="flex flex-col gap-3">
          {workspaces.map((workspace) => (
            <li key={workspace.id}>
              <Link
                to={`/w/${workspace.id}`}
                className="bg-card hover:bg-accent flex items-center gap-4 rounded-2xl border p-4 transition-colors"
              >
                <span className="bg-secondary flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl">
                  {workspaceCategoryIcon(workspace.category)}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{workspace.name}</span>
                  <span className="text-muted-foreground block text-sm">
                    {ROLE_LABELS[workspace.role]} · {workspace.memberCount}{' '}
                    {pluralMembers(workspace.memberCount)}
                  </span>
                </span>

                <ChevronRight className="text-muted-foreground size-5 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link to="/create" className={cn(buttonVariants(), 'flex-1')}>
          <Plus className="size-4" />
          Создать группу
        </Link>

        <Link to="/join" className={cn(buttonVariants({ variant: 'secondary' }), 'flex-1')}>
          <LogIn className="size-4" />
          Войти по коду
        </Link>
      </div>
    </main>

    <BottomNav />
    </>
  )
}

function pluralMembers(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) return 'участник'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'участника'
  return 'участников'
}
