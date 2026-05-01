import { LOCAL_STORAGE_KEYS } from 'common'
import { useParams } from 'common/hooks'
import Image from 'next/image'
import Link from 'next/link'
import { Badge, Button, Skeleton } from 'ui'

import { BannerCard } from '../BannerCard'
import { BANNER_ID, useBannerStack } from '../BannerStackProvider'
import { useAvailableIntegrations } from '@/components/interfaces/Integrations/Landing/useAvailableIntegrations'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useTrack } from '@/lib/telemetry/track'

interface FeatureMarketplaceItemBannerProps {
  category: string
}

function formatCategoryTitle(category: string) {
  return category
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const FeatureMarketplaceItemBanner = ({ category }: FeatureMarketplaceItemBannerProps) => {
  const { ref } = useParams()
  const track = useTrack()
  const { dismissBanner } = useBannerStack()
  const { data: integrations = [], isPending } = useAvailableIntegrations()
  const categoryIntegrations = integrations.filter((integration) =>
    integration.categories?.includes(category)
  )
  const integration =
    categoryIntegrations.find((integration) => integration.featured) ?? categoryIntegrations[0]
  const heroImage = integration?.files?.[0]
  const [, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.FEATURED_MARKETPLACE_ITEM_BANNER_DISMISSED(ref ?? '', category),
    false
  )

  if (!isPending && !integration) return null

  const trackBannerClick = () =>
    track('marketplace_item_banner_clicked', {
      category,
      integration_id: integration?.id,
    })

  return (
    <BannerCard
      closeVariant="secondary"
      onDismiss={() => {
        setIsDismissed(true)
        dismissBanner(BANNER_ID.FEATURED_MARKETPLACE_ITEM)
        trackBannerClick()
      }}
    >
      <div className="-m-6 flex flex-col">
        <div className="flex flex-col items-start">
          {isPending ? (
            <Skeleton className="w-full aspect-video max-h-32 rounded-none" />
          ) : heroImage ? (
            <div className="relative w-full aspect-video max-h-32 overflow-hidden">
              <Image
                fill
                src={heroImage}
                alt={`${integration?.name ?? 'Marketplace'} integration preview`}
                className="object-cover object-top"
                sizes="320px"
              />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-surface-300 text-foreground">
              {integration?.icon({ className: 'w-5 h-5' })}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-y-4 p-6">
          {integration?.status && <Badge variant="warning">{integration.status}</Badge>}
          <div className="flex flex-col gap-y-1 mb-2">
            {isPending ? (
              <>
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </>
            ) : (
              <>
                <p className="heading-meta text-foreground-light mb-1">Featured Integration</p>
                <p className="text-sm font-medium">{integration?.name ?? 'Marketplace item'}</p>
                <p className="text-xs text-foreground-lighter text-balance">
                  {integration?.description ??
                    `Set up this ${formatCategoryTitle(category).toLowerCase()} integration from the marketplace.`}
                </p>
              </>
            )}
          </div>
          {isPending ? (
            <div className="flex gap-2">
              <Skeleton className="h-7 w-24" />
            </div>
          ) : (
            <div className="flex w-full">
              <Button
                type="default"
                size="tiny"
                className="w-full justify-center"
                asChild
                onClick={trackBannerClick}
              >
                <Link href={`/project/${ref}/integrations/${integration?.id}/overview`}>
                  View details
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </BannerCard>
  )
}
