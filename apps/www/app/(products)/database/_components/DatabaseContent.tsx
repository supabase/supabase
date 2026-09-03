import { FeaturesSection } from './FeaturesSection'
import { Hero } from './Hero'
import { HighlightsSection } from './HighlightsSection'
import { QuoteSection } from './QuoteSection'
import { SqlEditorSection } from './SqlEditorSection'
import { TableEditorSection } from './TableEditorSection'
import { VisualDemo } from './VisualDemo'
import { BuiltWithSupabaseSection } from '@/components/BuiltWithSupabaseSection'
import { CTASection } from '@/components/CTASection'

export function DatabaseContent({ apiSlot }: { apiSlot: React.ReactNode }) {
  return (
    <div className="overflow-x-clip">
      <section aria-label="Hero">
        <Hero />
        <VisualDemo />
      </section>
      <section id="features" className="border-t border-border" aria-label="Database features">
        <FeaturesSection />
      </section>
      <section id="quote" className="border-t border-border" aria-label="Customer quote">
        <QuoteSection />
      </section>
      <section id="highlights" className="border-t border-border" aria-label="Database highlights">
        <HighlightsSection />
      </section>
      <section id="table-editor" className="border-t border-border" aria-label="Table editor">
        <TableEditorSection />
      </section>
      <section id="sql-editor" className="border-t border-border" aria-label="SQL editor">
        <SqlEditorSection />
      </section>
      <section id="api" className="border-t border-border" aria-label="API examples">
        {apiSlot}
      </section>
      <section
        id="built-with-supabase"
        className="border-t border-border"
        aria-label="Built with Supabase"
      >
        <BuiltWithSupabaseSection />
      </section>
      <section id="get-started" className="border-t border-border" aria-label="Get started">
        <CTASection />
      </section>
    </div>
  )
}
