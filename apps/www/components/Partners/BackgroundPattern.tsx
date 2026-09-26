import { cn } from 'ui'

const BackgroundPattern = ({ className }: { className?: string }) => {
  return (
    <div className={cn('absolute inset-x-0 top-0 h-1/2 w-full', className)}>
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 w-full dark:opacity-50 [radial-gradient(ellipse_70%_90%_at_50%_0%,black,transparent_70%)] [-webkit-mask-image:radial-gradient(ellipse_70%_90%_at_50%_0%,black,transparent_70%)]"
      >
        <defs>
          <pattern id="partner-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path
              d="M30 0V30M0 30H30"
              fill="none"
              stroke="hsl(var(--border-strong))"
              strokeWidth="1"
              strokeDasharray="6 6"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#partner-grid)" />
      </svg>
      {/* Soft brand-green radial glow from the top */}
      <div
        aria-hidden
        className="pointer-events-none hidden dark:block absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,hsl(var(--brand-400)/0.15),transparent_70%)]"
      />
    </div>
  )
}

export default BackgroundPattern
