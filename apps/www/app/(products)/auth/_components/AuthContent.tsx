import { FeaturesSection } from './FeaturesSection'
import { Hero } from './Hero'
import { HighlightsSection } from './HighlightsSection'
import { QuoteSection } from './QuoteSection'
import { BuiltWithSupabaseSection } from '@/components/BuiltWithSupabaseSection'
import { CTASection } from '@/components/CTASection'

export function AuthContent({
  apiSlot,
  rlsSlot,
}: {
  apiSlot: React.ReactNode
  rlsSlot: React.ReactNode
}) {
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
      <section className="border-t border-border">
        <HighlightsSection />
      </section>
      <section className="border-t border-border">{apiSlot}</section>
      <section className="border-t border-border">{rlsSlot}</section>
      <section className="border-t border-border">
        <BuiltWithSupabaseSection />
      </section>
      <section className="border-t border-border">
        <CTASection />
      </section>
    </div>
  )
}
