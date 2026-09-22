import { ArrowLeft, ChevronRight, Crown, Shield, Star, UserMinus } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { Button } from '@/components/ui/button'
import { ConfirmDialog, type ConfirmRequest } from '@/components/ui/confirm-dialog'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspaceRealtime } from '@/hooks/useRealtime'
import { useWorkspaceStats } from '@/hooks/useStats'
import { useChangeMemberRole, useMembers, useRemoveMember, useWorkspace } from '@/hooks/useWorkspaces'
import { ROLE_LABELS } from '@/lib/constants'
import type { MemberWithProfile } from '@/services/workspaces'

export default function Members() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { userId } = useAuth()
  const navigate = useNavigate()
  const workspace = useWorkspace(workspaceId)
  const members = useMembers(workspaceId)
  const stats = useWorkspaceStats(workspaceId)
  const changeRole = useChangeMemberRole(workspaceId!)
  const removeMember = useRemoveMember(workspaceId!)
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)

  useWorkspaceRealtime(workspaceId)

  if (workspace.isSuccess && !workspace.data) {
    return <Navigate to="/" replace />
  }

  const me = members.data?.find((member) => member.userId === userId)
  const canManage = me?.role === 'owner' || me?.role === 'admin'
  const xpByUser = new Map(stats.data?.map((s) => [s.userId, s.xp]))

  function askRemove(member: MemberWithProfile) {
    const isSelf = member.userId === userId

    setConfirmRequest({
      title: isSelf ? 'Выйти из группы?' : `Удалить ${member.displayName}?`,
      description: isSelf
        ? 'Вы потеряете доступ к обязанностям этой группы.'
        : 'Участник потеряет доступ к обязанностям группы.',
      confirmLabel: isSelf ? 'Выйти' : 'Удалить',
      destructive: true,
      onConfirm: async () => {
        await removeMember.mutateAsync(member.id)
        if (isSelf) navigate('/')
      },
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

      <h1 className="text-2xl font-semibold tracking-tight">Участники</h1>

      {members.isPending && <div className="bg-muted h-24 animate-pulse rounded-2xl" />}

      {members.isError && <p className="text-destructive text-sm">Не удалось загрузить участников.</p>}

      <ul className="flex flex-col gap-3">
        {members.data?.map((member) => (
          <li key={member.id} className="bg-card rounded-2xl border">
            <div className="flex items-center gap-3 p-4">
              <Link
                to={`/w/${workspaceId}/member/${member.userId}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
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

                <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
                  <Star className="text-priority-high size-4" />
                  {xpByUser.get(member.userId) ?? 0}
                </span>

                <ChevronRight className="text-muted-foreground size-5 shrink-0" />
              </Link>
            </div>

            {canManage && member.role !== 'owner' && (
              <div className="flex items-center gap-1 border-t px-2 py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    changeRole.mutate({
                      memberId: member.id,
                      role: member.role === 'admin' ? 'member' : 'admin',
                    })
                  }
                >
                  {member.role === 'admin' ? 'Снять админа' : 'Сделать админом'}
                </Button>

                <Button variant="ghost" size="icon" onClick={() => askRemove(member)}>
                  <UserMinus className="text-destructive size-4" />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {me && me.role !== 'owner' && (
        <Button variant="outline" onClick={() => askRemove(me)}>
          Выйти из группы
        </Button>
      )}

      <ConfirmDialog request={confirmRequest} onCancel={() => setConfirmRequest(null)} />
    </main>

    <BottomNav workspaceId={workspaceId} />
    </>
  )
}
