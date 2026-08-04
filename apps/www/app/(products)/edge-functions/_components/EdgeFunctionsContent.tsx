import { QuoteSection } from '../../_shared/QuoteSection'
import { CTASection } from './CTASection'
import { ExamplesSection } from './ExamplesSection'
import { GlobalPresenceSection } from './GlobalPresenceSection'
import { Hero } from './Hero'
import { Highlights } from './Highlights'
import { IntegratesSection } from './IntegratesSection'
import { LocalDXSection } from './LocalDXSection'
import { ObservabilitySection } from './ObservabilitySection'

export function EdgeFunctionsContent() {
  return (
    <div className="overflow-x-clip">
      <section className="border-t border-border" aria-label="Hero">
        <Hero />
        <Highlights />
      </section>
      <section id="quote" className="border-t border-border" aria-label="Customer quote">
        <QuoteSection
          quote="The thing that makes everything possible, all of our rapid development now and AI-generated or assisted development, is Supabase."
          highlight="That's the giant whose shoulders we can stand on."
          author={{
            name: 'Seth Siegler',
            role: 'Chief Innovation Officer at eXp Realty',
            image: '/images/blog/avatars/seth-siegler.jpg',
            link: '/customers/exprealty',
          }}
        />
      </section>
      <section id="examples" className="border-t border-border" aria-label="Example projects">
        <ExamplesSection />
      </section>
      <section
        id="local-dx"
        className="border-t border-border"
        aria-label="Local developer experience"
      >
        <LocalDXSection />
      </section>
      <section id="global-presence" className="border-t border-border" aria-label="Global presence">
        <GlobalPresenceSection />
      </section>
      <section id="observability" className="border-t border-border" aria-label="Observability">
        <ObservabilitySection />
      </section>
      <section
        id="integrations"
        className="border-y border-border"
        aria-label="Supabase integrations"
      >
        <IntegratesSection />
      </section>
      <section id="get-started" aria-label="Get started">
        <CTASection />
      </section>
    </div>
  )
}
