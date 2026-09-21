import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'bg-card border-input placeholder:text-muted-foreground focus-visible:ring-ring h-12 w-full rounded-xl border px-4 text-base transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
