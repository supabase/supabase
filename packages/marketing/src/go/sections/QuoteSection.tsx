import type { GoQuoteSection } from '../schemas'

export default function QuoteSection({ section }: { section: GoQuoteSection }) {
  return (
    <div className="max-w-[80rem] mx-auto px-8">
      <figure className="max-w-3xl mx-auto text-center">
        <blockquote>
          <p className="text-foreground text-xl sm:text-2xl font-medium leading-relaxed">
            &ldquo;{section.quote}&rdquo;
          </p>
        </blockquote>
        <figcaption className="mt-6 flex items-center justify-center gap-3">
          {section.avatar && (
            <img
              src={section.avatar.src}
              alt={section.avatar.alt}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <div className="text-sm">
            <span className="text-foreground font-medium">{section.author}</span>
            {section.role && (
              <span className="text-foreground-lighter"> &middot; {section.role}</span>
            )}
          </div>
        </figcaption>
      </figure>
    </div>
  )
}
