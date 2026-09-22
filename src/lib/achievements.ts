import type { MemberStats } from '@/services/stats'
import type { PointsTransaction } from '@/types/database'

export type Achievement = {
  id: string
  icon: string
  title: string
  description: string
  current: number
  target: number
}

// Считаются из задач и начислений, которые и так есть — отдельного
// хранилища достижениям не нужно.
export function computeAchievements(
  stats: MemberStats,
  points: PointsTransaction[],
): Achievement[] {
  const early = points.filter((transaction) => transaction.reason === 'completed_early').length

  return [
    {
      id: 'first',
      icon: '🏆',
      title: 'Первая задача',
      description: 'Выполнить свою первую обязанность',
      current: Math.min(stats.completed, 1),
      target: 1,
    },
    {
      id: 'streak7',
      icon: '🔥',
      title: '7 дней подряд',
      description: 'Выполнять хотя бы одну обязанность неделю без перерывов',
      current: Math.min(stats.streak, 7),
      target: 7,
    },
    {
      id: 'xp100',
      icon: '⭐',
      title: '100 баллов',
      description: 'Набрать сотню баллов',
      current: Math.min(Math.max(stats.xp, 0), 100),
      target: 100,
    },
    {
      id: 'done10',
      icon: '💯',
      title: '10 выполнено',
      description: 'Закрыть десять обязанностей',
      current: Math.min(stats.completed, 10),
      target: 10,
    },
    {
      id: 'early5',
      icon: '🚀',
      title: '5 раньше срока',
      description: 'Пять раз управиться заранее',
      current: Math.min(early, 5),
      target: 5,
    },
  ]
}

export function isEarned(achievement: Achievement): boolean {
  return achievement.current >= achievement.target
}
