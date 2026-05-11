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
      <section className="pb-16 md:pb-32">
        <Hero />
        <Highlights />
      </section>
      <section className="border-t border-border">
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
      <section className="border-t border-border">
        <ExamplesSection />
      </section>
      <section className="border-t border-border">
        <LocalDXSection />
      </section>
      <section className="border-t border-border">
        <GlobalPresenceSection />
      </section>
      <section className="border-t border-border">
        <ObservabilitySection />
      </section>
      <section className="border-y border-border">
        <IntegratesSection />
      </section>
      <section className="">
        <CTASection />
      </section>
    </div>
  )
}
