import { FeaturesSection } from './FeaturesSection'
import { Hero } from './Hero'
import { QuoteSection } from './QuoteSection'
import { BuiltWithSupabaseSection } from '@/components/BuiltWithSupabaseSection'
import { CTASection } from '@/components/CTASection'

export function RealtimeContent({ apiSlot }: { apiSlot: React.ReactNode }) {
  return (
    <div className="overflow-x-clip">
      <section>
        <Hero />
      </section>
      <section className="border-t border-border">
        <FeaturesSection />
      </section>
      <section className="border-t border-border">
        <QuoteSection />
      </section>
      <section className="border-t border-border">{apiSlot}</section>
      <section className="border-t border-border">
        <BuiltWithSupabaseSection />
      </section>
      <section className="border-t border-border">
        <CTASection />
      </section>
    </div>
  )
}
