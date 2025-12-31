import { HeaderBanner } from 'components/interfaces/Organization/HeaderBanner'
import { InlineLink } from 'components/ui/InlineLink'

/**
 * Used to display ongoing incidents
 */
export const IncidentBanner = () => {
  return (
    <HeaderBanner
      variant="warning"
      title="We are investigating a technical issue"
      description={
        <>
          Follow the <InlineLink href="https://status.supabase.com">status page</InlineLink> for
          updates
        </>
      }
    />
  )
}
