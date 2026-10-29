import { cn } from 'ui'

interface BackgroundPatternProps {
  className?: string
  variant?: 'center' | 'edges'
}

const BackgroundPattern = ({ className, variant = 'center' }: BackgroundPatternProps) => {
  const patternId = `ambient-grid-${variant}`

  return (
    <div className={cn('absolute inset-x-0 top-0 h-1/2 w-full', className)}>
      <svg
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 w-full text-foreground/20 dark:text-foreground/30',
          variant === 'center'
            ? 'h-1/2 [-webkit-mask-image:radial-gradient(ellipse_70%_90%_at_50%_0%,black,transparent_70%)] [mask-image:radial-gradient(ellipse_70%_90%_at_50%_0%,black,transparent_70%)]'
            : 'h-full [-webkit-mask-image:linear-gradient(to_bottom,black_0%,transparent_82%)] [mask-image:linear-gradient(to_bottom,black_0%,transparent_82%)]'
        )}
      >
        <defs>
          <pattern id={patternId} width="30" height="30" patternUnits="userSpaceOnUse">
            <path
              d="M30 0V30M0 30H30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="6 6"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      {variant === 'edges' && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 w-[min(88rem,84vw)] -translate-x-1/2 bg-alternative [-webkit-mask-image:radial-gradient(ellipse_at_center,black_62%,transparent_88%)] [mask-image:radial-gradient(ellipse_at_center,black_62%,transparent_88%)]"
        />
      )}
      {/* Soft brand-green radial glow from the top */}
      <div
        aria-hidden
        className="pointer-events-none hidden dark:block absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,hsl(var(--brand-400)/0.15),transparent_70%)]"
      />
    </div>
  )
}

export default BackgroundPattern
