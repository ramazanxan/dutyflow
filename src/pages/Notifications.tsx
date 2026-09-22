import {
  ArrowLeft,
  BellOff,
  CheckCheck,
  CheckCircle2,
  Clock,
  MessageCircle,
  TriangleAlert,
  UserPlus,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  useMarkAllRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'
import type { Notification, NotificationType } from '@/types/database'

const ICONS: Record<NotificationType, { icon: typeof Clock; className: string }> = {
  task_assigned: { icon: UserPlus, className: 'text-status-progress' },
  task_completed: { icon: CheckCircle2, className: 'text-status-done' },
  task_overdue: { icon: TriangleAlert, className: 'text-status-overdue' },
  task_reminder: { icon: Clock, className: 'text-priority-high' },
  task_comment: { icon: MessageCircle, className: 'text-muted-foreground' },
  member_joined: { icon: Users, className: 'text-status-progress' },
}

export default function Notifications() {
  const navigate = useNavigate()
  const notifications = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllRead()

  const unread = notifications.data?.filter((item) => !item.is_read).length ?? 0

  function open(notification: Notification) {
    if (!notification.is_read) markRead.mutate(notification.id)

    if (notification.workspace_id && notification.task_id) {
      navigate(`/w/${notification.workspace_id}/task/${notification.task_id}`)
    } else if (notification.workspace_id) {
      navigate(`/w/${notification.workspace_id}`)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-5 py-8">
      <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm">
        <ArrowLeft className="size-4" />
        Главная
      </Link>

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Уведомления</h1>

        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="size-4" />
            Прочитать всё
          </Button>
        )}
      </div>

      {notifications.isPending && <div className="bg-muted h-24 animate-pulse rounded-2xl" />}

      {notifications.isError && (
        <p className="text-destructive text-sm">Не удалось загрузить уведомления.</p>
      )}

      {notifications.isSuccess && notifications.data.length === 0 && (
        <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border p-8 text-center">
          <BellOff className="text-muted-foreground size-10" />
          <p className="font-medium">Уведомлений пока нет</p>
          <p className="text-muted-foreground text-sm text-balance">
            Здесь появятся назначенные обязанности, напоминания о сроках и просрочки
          </p>
        </div>
      )}

      {notifications.data && notifications.data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {notifications.data.map((notification) => {
            const { icon: Icon, className } = ICONS[notification.type]

            return (
              <li key={notification.id}>
                <button
                  onClick={() => open(notification)}
                  className={cn(
                    'hover:bg-accent flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
                    notification.is_read ? 'bg-card' : 'bg-accent/60 border-primary/30',
                  )}
                >
                  <Icon className={cn('mt-0.5 size-5 shrink-0', className)} />

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={cn('truncate', !notification.is_read && 'font-medium')}>
                        {notification.title}
                      </span>
                      {!notification.is_read && (
                        <span className="bg-primary size-2 shrink-0 rounded-full" />
                      )}
                    </span>

                    {notification.message && (
                      <span className="text-muted-foreground block truncate text-sm">
                        {notification.message}
                      </span>
                    )}

                    <span className="text-muted-foreground block text-xs">
                      {new Date(notification.created_at).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
