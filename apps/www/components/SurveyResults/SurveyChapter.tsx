import { SurveyPullQuote } from './SurveyPullQuote'

interface SurveyChapterProps {
  number: number
  title: string
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
      <div className="flex flex-col container max-w-[60rem] mx-auto px-6 lg:px-0">
        <header
          className="flex flex-col gap-24"
          style={{
            background: `radial-gradient(circle at center 230%, hsl(var(--brand-500)), transparent 70%)`,
          }}
        >
          {/* Decorative progress bar */}
          <div aria-hidden="true" className="flex flex-col">
            {[0, 1, 2, 3].map((item, index) => (
              <div
                key={index}
                className={`h-${(index + 1) * 4} w-full ${index === 0 ? 'bg-brand' : index === 1 ? 'bg-brand-500' : 'bg-brand-300'}`}
                style={{
                  maskImage: 'url("/survey/pattern-front.svg")',
                  maskSize: '14.5px 15px',
                  maskRepeat: 'repeat',
                  maskPosition: 'top left',
                }}
              />
            ))}
          </div>
          {/* Text content */}
          <div className="flex flex-col gap-4  text-balance pb-12">
            <h2 className="text-3xl md:text-4xl xl:text-6xl text-balance leading-tight">{title}</h2>
            <p className="text-lg xl:text-xl text-foreground-light text-balance">{description}</p>
          </div>
        </header>
        <div className="flex flex-col pb-32">{children}</div>
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
