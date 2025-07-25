export function SurveySubSection({
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
    <div className="flex flex-col gap-4 md:gap-8">
      <header>
        <h3 className="text-brand font-mono uppercase tracking-widest text-sm">
          {number} {title}
        </h3>
        <p className="text-foreground text-xl text-balance">{description}</p>
      </header>
      {children}
    </div>
  )
}
