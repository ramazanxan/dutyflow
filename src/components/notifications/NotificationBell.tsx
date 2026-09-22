import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUnreadCount } from '@/hooks/useNotifications'

export function NotificationBell() {
  const unread = useUnreadCount()

  return (
    <Link
      to="/notifications"
      aria-label={unread > 0 ? `Уведомления, непрочитанных: ${unread}` : 'Уведомления'}
      className="hover:bg-accent relative flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors"
    >
      <Bell className="size-5" />

      {unread > 0 && (
        <span className="bg-destructive text-destructive-foreground absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-medium">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}
