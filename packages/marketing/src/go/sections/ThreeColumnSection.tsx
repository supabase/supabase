import type { GoThreeColumnSection } from '../schemas'

export default function ThreeColumnSection({ section }: { section: GoThreeColumnSection }) {
  return (
    <section>
      {(section.title || section.description) && (
        <div className="max-w-[80rem] mx-auto flex flex-col items-center gap-4 text-center text-balance px-8 mb-10">
          {section.title && (
            <h2 className="text-2xl md:text-3xl lg:text-4xl leading-tight tracking-tight">
              {section.title}
            </h2>
          )}
          {section.description && (
            <p className="text-foreground-light text-lg max-w-2xl">{section.description}</p>
          )}
        </div>
      )}
      {section.children && (
        <div className="max-w-[80rem] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-8">
          {section.children}
        </div>
      )}
    </section>
  )
}
