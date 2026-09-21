import { ArrowLeft, Flame, Star } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useMemberPoints, useWorkspaceStats } from '@/hooks/useStats'
import { useWorkspace } from '@/hooks/useWorkspaces'
import { pointsReasonLabel } from '@/lib/tasks'
import { cn } from '@/lib/utils'

export default function MemberStats() {
  const { workspaceId, userId } = useParams<{ workspaceId: string; userId: string }>()
  const workspace = useWorkspace(workspaceId)
  const stats = useWorkspaceStats(workspaceId)
  const points = useMemberPoints(workspaceId, userId)

  if (stats.isPending) {
    return (
      <main className="mx-auto w-full max-w-md px-5 py-8">
        <div className="bg-muted h-40 animate-pulse rounded-2xl" />
      </main>
    )
  }

  const member = stats.data?.find((entry) => entry.userId === userId)

  if (!member) {
    return <Navigate to={`/w/${workspaceId}/members`} replace />
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 py-8">
      <Link
        to={`/w/${workspaceId}/members`}
        className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        Участники
      </Link>

      <header className="flex items-center gap-4">
        <span className="bg-secondary text-secondary-foreground flex size-14 shrink-0 items-center justify-center rounded-full text-xl font-medium">
          {member.displayName.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{member.displayName}</h1>
          <p className="text-muted-foreground text-sm">{workspace.data?.name}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Metric
          icon={<Star className="text-priority-high size-5" />}
          value={member.xp}
          label="Баллов"
        />
        <Metric
          icon={<Flame className="text-status-overdue size-5" />}
          value={member.streak}
          label={`${dayWord(member.streak)} подряд`}
        />
      </div>

      <dl className="bg-card flex flex-col gap-3 rounded-2xl border p-4 text-sm">
        <Row label="Назначено обязанностей" value={member.assigned} />
        <Row label="Выполнено" value={member.completed} />
        <Row label="Сейчас просрочено" value={member.overdue} />
        <Row label="Процент выполнения" value={`${member.completionRate}%`} />
      </dl>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">История начислений</h2>

        {points.isPending && <div className="bg-muted h-20 animate-pulse rounded-2xl" />}

        {points.isSuccess && points.data.length === 0 && (
          <p className="text-muted-foreground text-sm">Баллов пока не было</p>
        )}

        {points.data && points.data.length > 0 && (
          <ul className="bg-card flex flex-col rounded-2xl border">
            {points.data.map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-center justify-between gap-4 border-b p-4 text-sm last:border-b-0"
              >
                <span className="min-w-0">
                  <span className="block">{pointsReasonLabel(transaction.reason)}</span>
                  <span className="text-muted-foreground block text-xs">
                    {new Date(transaction.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </span>

                <span
                  className={cn(
                    'shrink-0 font-medium',
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
      </section>
    </main>
  )
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-card flex flex-col items-center gap-1 rounded-2xl border p-5">
      {icon}
      <span className="text-3xl font-semibold">{value}</span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

function dayWord(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня'
  return 'дней'
}
