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
      className="flex flex-col bg-200 border-t last-of-type:border-b pt-40"
    >
      <div className="flex flex-col container max-w-[60rem] mx-auto px-6 lg:px-0">
        <header className="mx-auto flex flex-col gap-4 text-center text-balance">
          <h2 className="text-3xl md:text-4xl xl:text-6xl text-balance leading-tight">{title}</h2>
          <p className="text-lg xl:text-xl text-foreground-light text-balance">{description}</p>
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
