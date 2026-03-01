import { cn } from '@/lib/utils'

type BadgeProps = {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'status'
  className?: string
}

export function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium',
        variant === 'default' &&
          'bg-[var(--bg-subtle)] text-[var(--text-secondary)]',
        variant === 'accent' &&
          'bg-[var(--accent-dim)] text-[var(--accent)]',
        variant === 'status' &&
          'bg-[var(--accent-dim)] text-[var(--accent)]',
        className,
      )}
    >
      {children}
    </span>
  )
}
