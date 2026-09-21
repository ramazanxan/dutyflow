import { Button } from '@/components/ui/button'

export type ConfirmRequest = {
  title: string
  description?: string
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  request,
  onCancel,
}: {
  request: ConfirmRequest | null
  onCancel: () => void
}) {
  if (!request) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={request.title}
        className="bg-card animate-in fade-in slide-in-from-bottom-4 w-full max-w-sm rounded-2xl border p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{request.title}</h2>

        {request.description && (
          <p className="text-muted-foreground mt-2 text-sm">{request.description}</p>
        )}

        <div className="mt-6 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Отмена
          </Button>
          <Button
            variant={request.destructive ? 'destructive' : 'primary'}
            className="flex-1"
            onClick={() => {
              request.onConfirm()
              onCancel()
            }}
            autoFocus
          >
            {request.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
