import { Button } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { InlineLink } from '@/components/ui/InlineLink'
import { useTrack } from '@/lib/telemetry/track'

export const DPA = () => {
  const track = useTrack()

  return (
    <PageSection orientation="horizontal">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Data Processing Addendum (DPA)</PageSectionTitle>
          <PageSectionDescription className="space-y-2">
            <p>
              Our Data Processing Addendum is incorporated into our{' '}
              <InlineLink href="https://supabase.com/terms">Terms of Service</InlineLink>, so all
              organizations get its protections automatically. No separate signed DPA is needed.
            </p>
            <p>If you signed a DPA with us previously, that agreement remains binding.</p>
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <div className="@lg:flex items-center justify-center h-full">
          <Button asChild>
            <a
              href="https://supabase.com/legal/customer-resources/data-processing-addendum"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => track('document_view_button_clicked', { documentName: 'DPA' })}
            >
              View DPA
            </a>
          </Button>
        </div>
      </PageSectionContent>
    </PageSection>
  )
}
