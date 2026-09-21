import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'bg-card border-input focus-visible:ring-ring h-12 w-full appearance-none rounded-xl border px-4 text-base transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
