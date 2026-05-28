import { cn } from 'ui'

const DOT_GRID_STYLE = {
  backgroundImage: 'radial-gradient(circle, hsl(var(--border-default)) 1px, transparent 1px)',
  backgroundSize: '18px 18px',
} as const

type IllustrationFrameProps = {
  children: React.ReactNode
  className?: string
  interactive?: boolean
}

export function IllustrationFrame({ children, className, interactive = false }: IllustrationFrameProps) {
  return (
    <div
      aria-hidden={interactive ? undefined : true}
      className={cn(
        'relative flex h-52 w-full overflow-hidden rounded-lg border border-default bg-surface-200/50 md:h-60',
        className
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0" style={DOT_GRID_STYLE} />
      {children}
    </div>
  )
}
