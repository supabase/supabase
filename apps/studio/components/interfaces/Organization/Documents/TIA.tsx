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

export const TIA = () => {
  const track = useTrack()

  return (
    <PageSection orientation="horizontal">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Transfer Impact Assessment (TIA)</PageSectionTitle>
          <PageSectionDescription className="space-y-2">
            <p>
              All organizations can access and use our latest TIA from the Trust Center as part of
              their GDPR-compliant data transfer process.
            </p>
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <div className="@lg:flex items-center justify-center h-full">
          <Button asChild iconRight={<ExternalLinkIcon />}>
            <a
              href="https://trust.supabase.io"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => track('document_view_button_clicked', { documentName: 'TIA' })}
            >
              View TIA in Trust Center
            </a>
          </Button>
        </div>
      </PageSectionContent>
    </PageSection>
  )
}
