import { BuiltWithSupabaseSection } from '~/app/(home)/_components/BuiltWithSupabaseSection'
import { CTASection } from '~/app/(home)/_components/CTASection'
import { FeaturesSection } from './FeaturesSection'
import { Hero } from './Hero'
import { HighlightsSection } from './HighlightsSection'
import { QuoteSection } from './QuoteSection'
import { SqlEditorSection } from './SqlEditorSection'
import { TableEditorSection } from './TableEditorSection'
import { VisualDemo } from './VisualDemo'

export function DatabaseContent({ apiSlot }: { apiSlot: React.ReactNode }) {
  return (
    <div className="overflow-x-clip">
      <section>
        <Hero />
        <VisualDemo />
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
      <section className="border-t border-border">
        <TableEditorSection />
      </section>
      <section className="border-t border-border">
        <SqlEditorSection />
      </section>
      <section className="border-t border-border">
        {apiSlot}
      </section>
      <section className="border-t border-border">
        <BuiltWithSupabaseSection />
      </section>
      <section className="border-t border-border">
        <CTASection />
      </section>
    </div>
  )
}
