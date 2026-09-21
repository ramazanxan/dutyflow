import type { MemberRole, WorkspaceCategory } from '@/types/database'

export const WORKSPACE_CATEGORIES: { value: WorkspaceCategory; label: string; icon: string }[] = [
  { value: 'home', label: 'Дом', icon: '🏠' },
  { value: 'work', label: 'Работа', icon: '💼' },
  { value: 'study', label: 'Учёба', icon: '🎓' },
  { value: 'other', label: 'Другое', icon: '📦' },
]

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  member: 'Участник',
}

export function workspaceCategoryIcon(category: WorkspaceCategory): string {
  return WORKSPACE_CATEGORIES.find((c) => c.value === category)?.icon ?? '📦'
}

export function inviteLink(code: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}#/join/${code}`
}
