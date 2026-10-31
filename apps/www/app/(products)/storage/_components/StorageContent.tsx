import { BucketTypesSection } from './BucketTypesSection'
import { FeaturesSection } from './FeaturesSection'
import { Hero } from './Hero'
import { QuoteSection } from './QuoteSection'
import { BuiltWithSupabaseSection } from '@/components/BuiltWithSupabaseSection'
import { CTASection } from '@/components/CTASection'

export function StorageContent({
  apiSlot,
  permissionsSlot,
}: {
  apiSlot: React.ReactNode
  permissionsSlot: React.ReactNode
}) {
  return (
    <div className="overflow-x-clip">
      <section aria-label="Hero">
        <Hero />
      </section>
      <section id="features" className="border-t border-border" aria-label="Storage features">
        <FeaturesSection />
      </section>
      <section id="quote" className="border-t border-border" aria-label="Customer quote">
        <QuoteSection />
      </section>
      <section id="bucket-types" className="border-t border-border" aria-label="Bucket types">
        <BucketTypesSection />
      </section>
      <section id="api" className="border-t border-border" aria-label="API examples">
        {apiSlot}
      </section>
      <section id="permissions" className="border-t border-border" aria-label="Permissions">
        {permissionsSlot}
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
