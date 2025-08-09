import { ExternalLink } from 'lucide-react'

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
    <ScaffoldSection>
      <ScaffoldSectionDetail className="sticky space-y-6 top-12">
        <p className="text-base m-0">Transfer Impact Assessment (TIA)</p>
        <div className="space-y-2 text-sm text-foreground-light m-0">
          <p>
            All organizations can access and use our TIA as part of their GDPR-compliant data
            transfer process.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent className="flex items-center justify-center h-full">
        <Button asChild type="default" iconRight={<ExternalLink />}>
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
            View TIA
          </a>
        </Button>
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}
