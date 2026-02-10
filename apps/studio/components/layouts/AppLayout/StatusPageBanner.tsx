import { useFlag } from 'common'

import { HeaderBanner } from '@/components/interfaces/Organization/HeaderBanner'
import { InlineLink } from '@/components/ui/InlineLink'

const BANNER_DESCRIPTION = (
  <>
    Follow the <InlineLink href="https://status.supabase.com">status page</InlineLink> for updates
  </>
)

/**
 * Used to display ongoing incidents
 */
export const StatusPageBanner = () => {
  const showIncidentBanner =
    useFlag('ongoingIncident') || process.env.NEXT_PUBLIC_ONGOING_INCIDENT === 'true'

  if (showIncidentBanner) {
    return (
      <HeaderBanner
        variant="warning"
        title="We are investigating a technical issue"
        description={BANNER_DESCRIPTION}
      />
    )
  }

  return null
}
