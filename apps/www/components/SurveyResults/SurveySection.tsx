import SectionContainer from '~/components/Layouts/SectionContainer'

export function SurveySection({
  number,
  title,
  description,
  children,
}: {
  number: number
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <SectionContainer className="flex flex-col gap-12 border-t border-default pt-12">
      <header className="flex flex-col gap-2">
        <aside className="text-brand font-mono uppercase tracking-widest text-sm">
          {number} / 7
        </aside>
        {/* TODO: fix clipped descenders on the title */}
        <h2 className="heading-gradient text-3xl sm:text-3xl xl:text-5xl text-balance">{title}</h2>
        <p className="text-lg text-foreground-light sm:text-xl xl:text-2xl text-balance">
          {description}
        </p>
      </header>
      {children}
    </SectionContainer>
  )
}
