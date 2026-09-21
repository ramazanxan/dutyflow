import { supabase } from '@/lib/supabase'
import { effectiveStatus } from '@/lib/tasks'
import type { MemberRole, PointsTransaction, Task } from '@/types/database'
import { listMembers } from '@/services/workspaces'

export type MemberStats = {
  userId: string
  displayName: string
  role: MemberRole
  xp: number
  assigned: number
  completed: number
  overdue: number
  completionRate: number
  streak: number
}

const DAY = 86_400_000

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

// Серия — сколько дней подряд человек что-то выполнял. Если сегодня ещё
// ничего не сделал, серия считается по вчерашний день и не обрывается.
function calcStreak(completedAt: string[]): number {
  if (!completedAt.length) return 0

  const days = new Set(completedAt.map((iso) => startOfDay(new Date(iso))))
  let cursor = startOfDay(new Date())
  if (!days.has(cursor)) cursor -= DAY

  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor -= DAY
  }
  return streak
}

export async function applyOverduePenalties(workspaceId: string): Promise<number> {
  const { data, error } = await supabase.rpc('apply_overdue_penalties', {
    _workspace_id: workspaceId,
  })

  if (error) throw error
  return data
}

export async function loadWorkspaceStats(workspaceId: string): Promise<MemberStats[]> {
  const [members, tasks, points] = await Promise.all([
    listMembers(workspaceId),
    supabase.from('tasks').select('*').eq('workspace_id', workspaceId),
    supabase.from('points_transactions').select('*').eq('workspace_id', workspaceId),
  ])

  if (tasks.error) throw tasks.error
  if (points.error) throw points.error

  return members.map((member) => {
    const mine = tasks.data.filter((task: Task) => task.assigned_to === member.userId)
    const completed = mine.filter((task) => task.status === 'completed')
    const overdue = mine.filter((task) => effectiveStatus(task) === 'overdue')
    const countable = mine.filter((task) => task.status !== 'cancelled')

    const xp = points.data
      .filter((transaction: PointsTransaction) => transaction.user_id === member.userId)
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    return {
      userId: member.userId,
      displayName: member.displayName,
      role: member.role,
      xp,
      assigned: countable.length,
      completed: completed.length,
      overdue: overdue.length,
      completionRate: countable.length
        ? Math.round((completed.length / countable.length) * 100)
        : 0,
      streak: calcStreak(completed.map((task) => task.completed_at).filter((v) => v !== null)),
    }
  })
}

export async function listTaskPoints(taskId: string): Promise<PointsTransaction[]> {
  const { data, error } = await supabase
    .from('points_transactions')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at')

  if (error) throw error
  return data
}

export async function listMemberPoints(
  workspaceId: string,
  userId: string,
): Promise<PointsTransaction[]> {
  const { data, error } = await supabase
    .from('points_transactions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data
}
