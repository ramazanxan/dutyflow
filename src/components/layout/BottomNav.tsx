import { Bell, CalendarDays, House, ListChecks, Settings, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useUnreadCount } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

type Item = {
  to: string
  label: string
  icon: typeof House
  end?: boolean
  badge?: number
}

export function BottomNav({ workspaceId }: { workspaceId?: string }) {
  const unread = useUnreadCount()

  const items: Item[] = workspaceId
    ? [
        { to: '/', label: 'Главная', icon: House, end: true },
        { to: `/w/${workspaceId}`, label: 'Задачи', icon: ListChecks, end: true },
        { to: `/w/${workspaceId}/calendar`, label: 'Календарь', icon: CalendarDays },
        { to: `/w/${workspaceId}/members`, label: 'Люди', icon: Users },
        { to: '/settings', label: 'Настройки', icon: Settings },
      ]
    : [
        { to: '/', label: 'Главная', icon: House, end: true },
        { to: '/notifications', label: 'Уведомления', icon: Bell, badge: unread },
        { to: '/settings', label: 'Настройки', icon: Settings },
      ]

  return (
    <nav className="bg-card/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur sm:hidden">
      <ul
        className="mx-auto flex max-w-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors',
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground',
                )
              }
            >
              <span className="relative">
                <item.icon className="size-5" />
                {item.badge ? (
                  <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-2 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-medium">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
