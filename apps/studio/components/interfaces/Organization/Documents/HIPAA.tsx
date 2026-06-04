import { ExternalLink } from 'lucide-react'
import { Button } from 'ui'

import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from '@/components/layouts/Scaffold'
import { useTrack } from '@/lib/telemetry/track'

export const HIPAA = () => {
  const track = useTrack()

  return (
    <ScaffoldSection className="py-12">
      <ScaffoldSectionDetail>
        <h4 className="mb-5">HIPAA</h4>
        <div className="space-y-2 text-sm text-foreground-light [&_p]:m-0">
          <p>
            This is only for HIPAA requests. Please ignore this if you already have HIPAA enabled.
          </p>
          <p>
            Organizations on the Team Plan or above are eligible for a paid HIPAA compliance add-on.
            You can submit a request here and we will get back to you on the pricing and process for
            your use case.
          </p>
          <p>
            Organizations on the Free or Pro Plan can also submit a request for HIPAA. Note that you
            are still required to upgrade to the Team Plan after your request is approved.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        <div className="@lg:flex items-center justify-center h-full">
          <Button asChild type="default" iconRight={<ExternalLink />}>
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
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}
