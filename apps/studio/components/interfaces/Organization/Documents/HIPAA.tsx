import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { ExternalLink } from 'lucide-react'
import { Button } from 'ui'

const HIPAA = () => {
  const organization = useSelectedOrganization()
  const { mutate: sendEvent } = useSendEventMutation()

  return (
    <>
      <ScaffoldSection>
        <ScaffoldSectionDetail className="sticky space-y-6 top-12">
          <p className="text-base m-0">HIPAA</p>
          <div className="space-y-2 text-sm text-foreground-light m-0">
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
          </div>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          <div className="flex items-center justify-center h-full">
            <a
              href="https://forms.supabase.com/hipaa2"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() =>
                sendEvent({
                  action: 'hipaa_request_button_clicked',
                  groups: { organization: organization?.slug ?? 'Unknown' },
                })
              }
            >
              <Button type="default" iconRight={<ExternalLink />}>
                Request HIPAA
              </Button>
            </a>
          </div>
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </>
  )
}

export default HIPAA
