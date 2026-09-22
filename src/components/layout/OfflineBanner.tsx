import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      role="status"
      className="bg-status-overdue animate-in slide-in-from-top fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-center text-sm text-white"
    >
      <WifiOff className="size-4 shrink-0" />
      Нет подключения. Изменения сохранятся после восстановления связи.
    </div>
  )
}
