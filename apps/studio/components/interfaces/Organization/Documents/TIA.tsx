import { ExternalLinkIcon } from 'lucide-react'
import { Button } from 'ui'

import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from '@/components/layouts/Scaffold'
import { useTrack } from '@/lib/telemetry/track'

export const TIA = () => {
  const track = useTrack()

  return (
    <ScaffoldSection className="py-12">
      <ScaffoldSectionDetail>
        <h4 className="mb-5">Transfer Impact Assessment (TIA)</h4>
        <div className="space-y-2 text-sm text-foreground-light [&_p]:m-0">
          <p>
            All organizations can access and use our latest TIA from the Trust Center as part of
            their GDPR-compliant data transfer process.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
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
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}
