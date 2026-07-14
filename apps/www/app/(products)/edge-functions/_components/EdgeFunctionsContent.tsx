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
          quote="Supabase gave us the flexibility and scalability needed at every growth stage."
          highlight="It's rare to find a tool that works just as well for startups as it does for large-scale operations."
          author={{
            name: 'Zeno Rocha',
            role: 'CEO at Resend',
            image: '/images/blog/avatars/zeno-rocha.png',
            link: '/customers/resend',
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
