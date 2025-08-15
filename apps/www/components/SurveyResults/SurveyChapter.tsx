import { SurveyPullQuote } from './SurveyPullQuote'
import './surveyChapter.css'

interface SurveyChapterProps {
  number: number
  title: string
  shortTitle: string
  description: string
  pullQuote?: {
    quote: string
    author: string
    authorPosition: string
    authorAvatar: string
  }
  children: React.ReactNode
  totalChapters?: number
}

export function SurveyChapter({
  number,
  title,
  shortTitle,
  description,
  pullQuote,
  children,
  totalChapters,
}: SurveyChapterProps) {
  return (
    <section
      id={`chapter-${number}`}
      // border-t last-of-type:border-b
      className="flex flex-col bg-alternative"
    >
      <div className="flex flex-col">
        {/* Chapter header */}
        <header
          className={`flex flex-col gap-24 border-b border-muted`}
          style={{
            background: `radial-gradient(circle at ${number % 2 === 0 ? '65%' : '35%'} 280%, hsl(var(--brand-500)), transparent 70%)`,
          }}
        >
          {/* Decorative progress bar */}
          <div
            aria-hidden="true"
            className={`flex flex-col w-full ${number % 2 === 0 ? 'self-start' : 'self-end'}`}
            style={{
              maxWidth: 'calc(50% + 60rem / 2)',
            }}
          >
            {[0, 1, 2, 3].map((item, index) => (
              <div key={index} className="relative">
                {/* Background bar (static) */}
                <div
                  className={`h-${(index + 1) * 4} w-full ${index === 0 ? 'bg-foreground-muted/80' : index === 1 ? 'bg-foreground-muted/50' : 'bg-foreground-muted/20'}`}
                  // className={`h-${(index + 1) * 4} w-full ${index === 0 ? 'bg-brand/20' : index === 1 ? 'bg-brand-500/20' : 'bg-brand-300/20'}`}
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
                    animation: `terminalLine 10s steps(8, end) ${index * 0.3}s infinite ${number % 2 === 0 ? '' : 'reverse'}`,
                  }}
                />
              </div>
            ))}
          </div>
          {/* Text content */}
          <div className="max-w-[60rem] mx-auto grid gap-y-8 grid-cols-1 md:grid-cols-3 text-balance pb-12">
            <div className="md:col-span-2 flex flex-col gap-4 px-8">
              <p className="text-sm text-brand-link uppercase font-mono text-balance tracking-wide">
                {shortTitle}
              </p>
              <h2 className="text-3xl md:text-4xl xl:text-6xl text-balance leading-tight">
                {title}
              </h2>
            </div>
            <p className="md:col-span-2 md:col-start-2 text-lg xl:text-xl text-foreground text-balance px-8">
              {description}
            </p>
          </div>
        </header>
        {/* Chapter content */}
        <div className="flex flex-col">{children}</div>
      </div>

      {pullQuote && (
        <SurveyPullQuote
          quote={pullQuote.quote}
          author={pullQuote.author}
          authorPosition={pullQuote.authorPosition}
          authorAvatar={pullQuote.authorAvatar}
        />
      )}
    </section>
  )
}
