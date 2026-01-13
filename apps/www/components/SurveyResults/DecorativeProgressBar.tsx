interface ProgressBarProps {
  className?: string
  backgroundClassName?: string
  foregroundClassName?: string
  animationDelay: string
  reverse?: boolean
}

export function ProgressBar({
  className = 'h-4',
  backgroundClassName = 'bg-foreground-muted/80',
  foregroundClassName = 'bg-brand',
  animationDelay,
  reverse = false,
}: ProgressBarProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Background bar (static) */}
      <div
        className={`h-full w-full ${backgroundClassName}`}
        style={{
          maskImage: 'url("/images/state-of-startups/pattern-stipple.svg")',
          maskSize: '4px',
          maskRepeat: 'repeat',
          maskPosition: 'center',
        }}
      />

      {/* Animated foreground bar */}
      <div
        className={`absolute inset-0 h-full w-full ${foregroundClassName}`}
        style={{
          maskImage: 'url("/images/state-of-startups/pattern-checker.svg")',
          maskSize: '4px',
          maskRepeat: 'repeat',
          maskPosition: 'top left',
          clipPath: 'inset(0 100% 0 0)',
          animation: `terminalLine 10s steps(8, end) ${animationDelay} infinite ${reverse ? 'reverse' : ''}`,
          animationFillMode: 'both',
        }}
      />
    </div>
  )
}

interface DecorativeProgressBarProps {
  /** Whether to reverse the animation direction */
  reverse?: boolean
  /** Whether to align to start or end */
  align?: 'start' | 'end'
}

export function DecorativeProgressBar({
  reverse = false,
  align = 'start',
}: DecorativeProgressBarProps) {
  // Define the three progress bar configurations
  const progressBars = [
    {
      height: 'h-4',
      bgColor: 'bg-foreground-muted/80',
      fgColor: 'bg-brand',
      animationDelay: '0s',
    },
    {
      height: 'h-8',
      bgColor: 'bg-foreground-muted/50',
      fgColor: 'bg-brand-500',
      animationDelay: '0.3s',
    },
    {
      height: 'h-12',
      bgColor: 'bg-foreground-muted/20',
      fgColor: 'bg-brand-300',
      animationDelay: '0.6s',
    },
  ]

  return (
    <div
      aria-hidden="true"
      className={`flex flex-col w-full ${align === 'start' ? 'self-start' : 'self-end'}`}
      style={{
        maxWidth: 'calc(50% + 60rem / 2)',
      }}
    >
      {progressBars.map((bar, index) => (
        <ProgressBar
          key={`progress-bar-${index}`}
          className={bar.height}
          backgroundClassName={bar.bgColor}
          foregroundClassName={bar.fgColor}
          animationDelay={bar.animationDelay}
          reverse={reverse}
        />
      ))}
    </div>
  )
}
