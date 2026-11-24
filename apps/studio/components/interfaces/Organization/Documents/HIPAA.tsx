import { ExternalLinkIcon } from 'lucide-react'
import { Button } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { useTrack } from '@/lib/telemetry/track'

export const HIPAA = () => {
  const track = useTrack()

  return (
    <PageSection orientation="horizontal">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>HIPAA</PageSectionTitle>
          <PageSectionDescription className="space-y-2">
            <p>
              This is only for HIPAA requests. Please ignore this if you already have HIPAA enabled.
            </p>
            <p>
              Organizations on the Team Plan or above are eligible for a paid HIPAA compliance
              add-on. You can submit a request here and we will get back to you on the pricing and
              process for your use case.
            </p>
            <p>
              Organizations on the Free or Pro Plan can also submit a request for HIPAA. Note that
              you are still required to upgrade to the Team Plan after your request is approved.
            </p>
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <div className="@lg:flex items-center justify-center h-full">
          <Button asChild iconRight={<ExternalLinkIcon />}>
            <a
              href="https://forms.supabase.com/hipaa2"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => track('hipaa_request_button_clicked')}
            >
              Request HIPAA
            </a>
          </Button>
        </div>
      </PageSectionContent>
    </PageSection>
  )
}
