import { SurveySectionBreak } from './SurveySectionBreak'

export interface PullQuoteGridItem {
  quote: string
  author: string
  authorPosition?: string
  theme?: string
}

export function SurveyPullQuoteGrid({ quotes }: { quotes: PullQuoteGridItem[] }) {
  return (
    <>
      <aside className="relative border-b border-muted md:border-b-0">
        <div
          className="absolute inset-0 pointer-events-none bg-surface-400 dark:bg-surface-75"
          style={{
            maskImage: 'url("/images/state-of-startups/pattern-stipple.svg")',
            maskSize: '4px',
            maskRepeat: 'repeat',
            maskPosition: 'top left',
          }}
        />
        <div className="relative max-w-240 mx-auto md:border-x border-muted bg-alternative grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-muted [&>*:nth-child(1)]:md:border-b [&>*:nth-child(2)]:md:border-b [&>*]:md:border-muted">
          {quotes.map((q, i) => (
            <div key={i} className="flex flex-col gap-4 px-8 py-12">
              {q.theme && (
                <span className="text-brand-link dark:text-brand text-xs font-mono uppercase tracking-widest">
                  {q.theme}
                </span>
              )}
              <p className="text-foreground-lighter text-xl tracking-tight text-balance">
                “{q.quote}”
              </p>
              <p className="mt-auto">
                {q.author}
                {q.authorPosition && (
                  <>
                    <br />
                    <span className="text-foreground-muted text-sm">{q.authorPosition}</span>
                  </>
                )}
              </p>
            </div>
          ))}
        </div>
      </aside>
      <SurveySectionBreak className="hidden md:block" />
    </>
  )
}
