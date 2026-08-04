import { Button } from 'ui'

import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from '@/components/layouts/Scaffold'
import { InlineLink } from '@/components/ui/InlineLink'
import { useTrack } from '@/lib/telemetry/track'

export const DPA = () => {
  const track = useTrack()

  return (
    <ScaffoldSection className="py-12">
      <ScaffoldSectionDetail>
        <h4 className="mb-5">Data Processing Addendum (DPA)</h4>
        <div className="space-y-2 text-sm text-foreground-light [&_p]:m-0">
          <p>
            Our Data Processing Addendum is incorporated into our{' '}
            <InlineLink href="https://supabase.com/terms">Terms of Service</InlineLink>, so all
            organizations get its protections automatically. No separate signed DPA is needed.
          </p>
          <p>If you signed a DPA with us previously, that agreement remains binding.</p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        <div className="@lg:flex items-center justify-center h-full">
          <Button asChild variant="default">
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
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}
