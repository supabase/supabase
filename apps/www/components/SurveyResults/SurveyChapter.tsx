import { SurveyPullQuote } from './SurveyPullQuote'
import './surveyResults.css'
import { DecorativeProgressBar } from './DecorativeProgressBar'

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
}

export function SurveyChapter({
  number,
  title,
  shortTitle,
  description,
  pullQuote,
  children,
}: SurveyChapterProps) {
  return (
    <section id={`chapter-${number}`} className="flex flex-col bg-alternative">
      <div className="flex flex-col">
        {/* Chapter header */}
        <header
          className={`flex flex-col gap-24 border-b border-muted`}
          style={{
            background: `radial-gradient(circle at ${number % 2 === 0 ? '65%' : '35%'} 280%, hsl(var(--brand-300)), transparent 70%)`,
          }}
        >
          {/* Decorative progress bar */}
          <DecorativeProgressBar
            reverse={number % 2 !== 0}
            align={number % 2 === 0 ? 'start' : 'end'}
          />
          {/* Text content */}
          <div className="max-w-[60rem] mx-auto grid gap-y-4 sm:gap-y-8 grid-cols-1 md:grid-cols-3 text-balance pb-12">
            <div className="md:col-span-2 flex flex-col gap-4 px-8">
              <p className="text-sm text-brand-link uppercase font-mono text-balance tracking-wider">
                {shortTitle}
              </p>
              <h2 className="text-4xl md:text-5xl xl:text-6xl text-balance leading-tight tracking-tight">
                {title}
              </h2>
            </div>
            <p className="md:col-span-2 md:col-start-2 text-lg md:text-xl leading-relaxed text-foreground-light md:text-foreground text-balance px-8">
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
