interface DecorativeProgressBarProps {
  /** Whether to reverse the animation direction */
  reverse?: boolean
  /** Additional CSS classes */
  className?: string
  /** Whether to align to start or end */
  align?: 'start' | 'end'
}

export function DecorativeProgressBar({
  reverse = false,
  align = 'start',
}: DecorativeProgressBarProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex flex-col w-full ${align === 'start' ? 'self-start' : 'self-end'}`}
      style={{
        maxWidth: 'calc(50% + 60rem / 2)',
      }}
    >
      {[0, 1, 2].map((item, index) => (
        <div key={index} className="relative">
          {/* Background bar (static) */}
          <div
            className={`h-${(index + 1) * 4} w-full ${index === 0 ? 'bg-foreground-muted/80' : index === 1 ? 'bg-foreground-muted/50' : 'bg-foreground-muted/20'}`}
            style={{
              maskImage: 'url("/images/state-of-startups/pattern-back.svg")',
              maskSize: '15px 15px',
              maskRepeat: 'repeat',
              maskPosition: 'center',
            }}
          />

          {/* Animated foreground bar */}
          <div
            className={`absolute inset-0 h-${(index + 1) * 4} w-full ${index === 0 ? 'bg-brand' : index === 1 ? 'bg-brand-500' : 'bg-brand-300'}`}
            style={{
              maskImage: 'url("/images/state-of-startups/pattern-front.svg")',
              maskSize: '14.5px 15px',
              maskRepeat: 'repeat',
              maskPosition: 'top left',
              animation: `terminalLine 10s steps(8, end) ${index * 0.3}s infinite ${reverse ? 'reverse' : ''}`,
            }}
          />
        </div>
      ))}
    </div>
  )
}
