import { cn } from 'ui'

export function SurveySectionBreak({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('border-y border-muted', className)}>
      <div className="max-w-[60rem] mx-auto md:border-x border-muted">
        <div
          className="h-14 md:h-18 lg:h-20 xl:h-24 bg-surface-400 dark:bg-surface-75"
          style={{
            maskImage: 'url("/images/state-of-startups/pattern-stipple.svg")',
            maskSize: '4px', // Match maskSize in SurveyPullQuote
            maskRepeat: 'repeat',
            maskPosition: 'top left',
          }}
        />
      </div>
    </div>
  )
}
