import { HeaderBanner } from '@/components/interfaces/Organization/HeaderBanner'
import { InlineLink } from '@/components/ui/InlineLink'
import { useStatusPageBannerVisibility } from './useStatusPageBannerVisibility'

const BANNER_DESCRIPTION = (
  <>
    Follow the <InlineLink href="https://status.supabase.com">status page</InlineLink> for updates
  </>
)

/**
 * Used to display ongoing incidents
 */
export const StatusPageBanner = () => {
  const banner = useStatusPageBannerVisibility()

  if (!banner) return null

  return <HeaderBanner variant="warning" title={banner.title} description={BANNER_DESCRIPTION} />
}
