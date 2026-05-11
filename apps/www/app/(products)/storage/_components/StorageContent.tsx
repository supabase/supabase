import { BuiltWithSupabaseSection } from '~/app/(home)/_components/BuiltWithSupabaseSection'
import { CTASection } from '~/app/(home)/_components/CTASection'
import { BucketTypesSection } from './BucketTypesSection'
import { FeaturesSection } from './FeaturesSection'
import { Hero } from './Hero'
import { QuoteSection } from './QuoteSection'

export function StorageContent({
  apiSlot,
  permissionsSlot,
}: {
  apiSlot: React.ReactNode
  permissionsSlot: React.ReactNode
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
        <BucketTypesSection />
      </section>
      <section className="border-t border-border">
        {apiSlot}
      </section>
      <section className="border-t border-border">
        {permissionsSlot}
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
