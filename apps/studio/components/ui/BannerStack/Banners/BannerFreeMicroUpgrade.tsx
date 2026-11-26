import { LOCAL_STORAGE_KEYS } from 'common'
import { useParams } from 'common/hooks'
import Link from 'next/link'
import { Button } from 'ui'
import { ComputeBadge } from 'ui-patterns/ComputeBadge'

import { BannerCard } from '../BannerCard'
import { BANNER_ID, useBannerStack } from '../BannerStackProvider'
import { getInfrastructurePath } from '@/components/interfaces/Settings/Infrastructure/Infrastructure.utils'
import { ChevronsUpAnimated } from '@/components/ui/ComputeBadgeWrapper'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useTrack } from '@/lib/telemetry/track'

export const BannerFreeMicroUpgrade = () => {
  const { ref } = useParams()
  const track = useTrack()
  const { dismissBanner } = useBannerStack()
  const [, setDismissedAt] = useLocalStorageQuery<string | null>(
    LOCAL_STORAGE_KEYS.FREE_MICRO_UPGRADE_BANNER_DISMISSED_AT(ref ?? ''),
    null
  )

  return (
    <BannerCard
      onDismiss={() => {
        setDismissedAt(new Date().toISOString())
        dismissBanner(BANNER_ID.FREE_MICRO_UPGRADE)
        track('free_micro_upgrade_banner_dismissed')
      }}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-2 items-start">
          <div className="animate-badge-pulse">
            <div className="relative inline-flex overflow-hidden rounded-sm">
              <ComputeBadge
                infraComputeSize="nano"
                icon={<ChevronsUpAnimated />}
                className="text-brand-600 border-brand-500 bg-brand-default/10 gap-1"
              />
              <span className="animate-badge-shimmer pointer-events-none absolute inset-0 bg-linear-to-br from-transparent via-brand-default/20 to-transparent blur-md" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">Compute Upgrade available</p>
          <p className="text-xs text-foreground-lighter text-balance">
            Your Pro plan includes a free upgrade to Micro — double the memory at no extra cost.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="tiny"
            asChild
            onClick={() => {
              setDismissedAt(new Date().toISOString())
              dismissBanner(BANNER_ID.FREE_MICRO_UPGRADE)
              track('free_micro_upgrade_banner_cta_clicked')
            }}
          >
            <Link href={`${getInfrastructurePath(ref)}?upgrade=micro`}>Upgrade for free</Link>
          </Button>
        </div>
      </div>
    </BannerCard>
  )
}
