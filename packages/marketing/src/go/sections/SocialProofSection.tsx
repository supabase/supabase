import type { GoSocialProofSection } from '../schemas'

export default function SocialProofSection({ section }: { section: GoSocialProofSection }) {
  return (
    <div className="text-center">
      {section.heading && <h2 className="text-foreground text-2xl mb-8">{section.heading}</h2>}
      {section.stats && section.stats.length > 0 && (
        <div className="flex items-center justify-center gap-12 mb-8">
          {section.stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-foreground text-3xl font-semibold">{stat.value}</p>
              <p className="text-foreground-lighter text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
      {section.testimonial && (
        <blockquote className="max-w-xl mx-auto">
          <p className="text-foreground-light text-lg italic">
            &ldquo;{section.testimonial.quote}&rdquo;
          </p>
          <footer className="mt-4 text-foreground-lighter text-sm">
            {section.testimonial.author}
            {section.testimonial.role && <span> &middot; {section.testimonial.role}</span>}
          </footer>
        </blockquote>
      )}
    </div>
  )
}
