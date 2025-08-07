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
    // SectionContainer
    // sm:py-18 container relative mx-auto px-6 py-16 md:py-24 lg:px-16 lg:py-24 xl:px-20
    <section
      id={`chapter-${number}`}
      className="flex flex-col bg-200 border-t pt-24"
      // className="bg-200 sm:py-18 relative py-16 md:py-24 lg:py-24 border-t border flex flex-col gap-12 border-t pt-12 mx-auto"
    >
      <div className="flex flex-col gap-12 container max-w-[60rem] mx-auto px-6 lg:px-0 pb-24">
        {/* <div className="flex flex-col gap-12 container max-w-[60rem] mx-auto px-6 lg:px-0"> */}
        <header className="mx-auto flex flex-col gap-2 text-center text-balance">
          <aside className="text-brand font-mono uppercase tracking-widest text-sm">
            {number}
            {totalChapters && ` / ${totalChapters}`}
          </aside>
          <h2 className="heading-gradient text-3xl sm:text-3xl xl:text-5xl text-balance leading-tight">
            {title}
          </h2>
          <p className="text-lg text-foreground-light sm:text-xl xl:text-2xl text-balance">
            {description}
          </p>
        </header>
        <div className="flex flex-col gap-16">{children}</div>
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
