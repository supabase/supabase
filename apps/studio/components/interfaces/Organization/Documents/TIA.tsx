import { Download } from 'lucide-react'

import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Button } from 'ui'

export const TIA = () => {
  const { data: organization } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  return (
    <ScaffoldSection className="py-12">
      <ScaffoldSectionDetail>
        <h4 className="mb-5">Transfer Impact Assessment (TIA)</h4>
        <div className="space-y-2 text-sm text-foreground-light [&_p]:m-0">
          <p>
            All organizations can access and use our TIA as part of their GDPR-compliant data
            transfer process.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        <div className="@lg:flex items-center justify-center h-full">
          <Button asChild type="default" iconRight={<Download />}>
            <a
              href="https://supabase.com/downloads/docs/Supabase+TIA+250314.pdf"
              target="_blank"
              rel="noreferrer noopener"
              download={true}
              onClick={() =>
                sendEvent({
                  action: 'document_view_button_clicked',
                  properties: { documentName: 'TIA' },
                  groups: { organization: organization?.slug ?? 'Unknown' },
                })
              }
            >
              Download TIA
            </a>
          </Button>
        </div>
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}
