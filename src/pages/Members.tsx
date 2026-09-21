import { ArrowLeft, Crown, Shield, UserMinus } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useChangeMemberRole, useMembers, useRemoveMember, useWorkspace } from '@/hooks/useWorkspaces'
import { ROLE_LABELS } from '@/lib/constants'
import type { MemberWithProfile } from '@/services/workspaces'

export default function Members() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { userId } = useAuth()
  const navigate = useNavigate()
  const workspace = useWorkspace(workspaceId)
  const members = useMembers(workspaceId)
  const changeRole = useChangeMemberRole(workspaceId!)
  const removeMember = useRemoveMember(workspaceId!)

  if (workspace.isSuccess && !workspace.data) {
    return <Navigate to="/" replace />
  }

  const me = members.data?.find((member) => member.userId === userId)
  const canManage = me?.role === 'owner' || me?.role === 'admin'

  async function handleRemove(member: MemberWithProfile) {
    const isSelf = member.userId === userId
    const message = isSelf
      ? 'Выйти из группы? Вы потеряете доступ к её обязанностям.'
      : `Удалить участника ${member.displayName} из группы?`

    if (!confirm(message)) return

    await removeMember.mutateAsync(member.id)
    if (isSelf) navigate('/')
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-5 py-8">
      <Link
        to={`/w/${workspaceId}`}
        className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        {workspace.data?.name ?? 'Назад'}
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Участники</h1>

      {members.isPending && <div className="bg-muted h-24 animate-pulse rounded-2xl" />}

      {members.isError && (
        <p className="text-destructive text-sm">Не удалось загрузить участников.</p>
      )}

      <ul className="flex flex-col gap-3">
        {members.data?.map((member) => (
          <li key={member.id} className="bg-card flex items-center gap-3 rounded-2xl border p-4">
            <span className="bg-secondary text-secondary-foreground flex size-10 shrink-0 items-center justify-center rounded-full font-medium">
              {member.displayName.slice(0, 1).toUpperCase()}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="truncate">{member.displayName}</span>
                {member.userId === userId && (
                  <span className="text-muted-foreground text-xs font-normal">(вы)</span>
                )}
              </span>
              <span className="text-muted-foreground flex items-center gap-1 text-sm">
                {member.role === 'owner' && <Crown className="size-3.5" />}
                {member.role === 'admin' && <Shield className="size-3.5" />}
                {ROLE_LABELS[member.role]}
              </span>
            </span>

            {canManage && member.role !== 'owner' && (
              <span className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    changeRole.mutate({
                      memberId: member.id,
                      role: member.role === 'admin' ? 'member' : 'admin',
                    })
                  }
                >
                  {member.role === 'admin' ? 'Снять админа' : 'Сделать админом'}
                </Button>

                <Button variant="ghost" size="icon" onClick={() => handleRemove(member)}>
                  <UserMinus className="text-destructive size-4" />
                </Button>
              </span>
            )}
          </li>
        ))}
      </ul>

      {me && me.role !== 'owner' && (
        <Button variant="outline" onClick={() => handleRemove(me)}>
          Выйти из группы
        </Button>
      )}
    </main>
  )
}
