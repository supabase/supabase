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

  const incidentTooltip =
    banner.incidents && banner.incidents.length > 0 ? (
      <div className="flex flex-col gap-1.5">
        <p className="font-medium">Active incidents</p>
        <ul className="space-y-0.5">
          {banner.incidents.map((incident) => (
            <li key={incident.id} className="text-foreground-light">
              {incident.name}
            </li>
          ))}
        </ul>
      </div>
    ) : undefined

  return (
    <HeaderBanner
      variant="warning"
      title={banner.title}
      description={BANNER_DESCRIPTION}
      onDismiss={banner.dismiss}
      titleTooltip={incidentTooltip}
    />
  )
}
