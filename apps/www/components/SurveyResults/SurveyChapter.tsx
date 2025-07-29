import SectionContainer from '~/components/Layouts/SectionContainer'

interface SurveyChapterProps {
  number: number
  title: string
  description: string
  children: React.ReactNode
  totalChapters?: number
}

export function SurveyChapter({
  number,
  title,
  description,
  children,
  totalChapters,
}: SurveyChapterProps) {
  return (
    <SectionContainer
      id={`chapter-${number}`}
      className="flex flex-col gap-12 border-t border-default pt-12"
    >
      <header className="flex flex-col gap-2">
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
    </SectionContainer>
  )
}
