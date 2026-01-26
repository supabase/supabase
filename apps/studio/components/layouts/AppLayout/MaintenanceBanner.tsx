import { HeaderBanner } from 'components/interfaces/Organization/HeaderBanner'
import { InlineLink } from 'components/ui/InlineLink'

/**
 * Used to display ongoing maintenance
 */
export function MaintenanceBanner() {
  return (
    <HeaderBanner
      variant="note"
      title="Scheduled maintenance is in progress"
      description={
        <>
          Follow the <InlineLink href="https://status.supabase.com">status page</InlineLink> for
          updates
        </>
      }
    />
  )
}
