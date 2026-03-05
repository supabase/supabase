import type { GoSingleColumnSection } from '../schemas'

export default function SingleColumnSection({ section }: { section: GoSingleColumnSection }) {
  return (
    <section>
      <div className="max-w-[80rem] mx-auto flex flex-col items-center gap-4 text-center text-balance px-8">
        <h2 className="text-2xl md:text-3xl lg:text-4xl leading-tight tracking-tight">
          {section.title}
        </h2>
        {section.description && (
          <p className="text-foreground-light text-lg max-w-2xl">{section.description}</p>
        )}
      </div>
      {section.children && (
        <div className="max-w-[80rem] mx-auto mt-10 px-8">{section.children}</div>
      )}
    </section>
  )
}
