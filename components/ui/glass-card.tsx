import { cn } from '@/lib/utils'

type GlassCardProps = {
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/80 backdrop-blur-sm',
        'transition-all duration-300 hover:border-[var(--border-hover)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
