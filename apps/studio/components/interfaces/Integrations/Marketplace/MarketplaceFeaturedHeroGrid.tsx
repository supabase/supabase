import { useParams } from 'common'
import Image from 'next/image'
import Link from 'next/link'
import { Badge, Card, cn } from 'ui'

import { IntegrationLogo } from '../Integration/IntegrationLogo'
import { getMarketplaceSource, MarketplaceSourceBadge } from './Marketplace.constants'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { BASE_PATH } from '@/lib/constants'

const FEATURED_INTEGRATION_IMAGES: Record<string, { dark: string; light?: string }> = {
  cron: {
    dark: `${BASE_PATH}/img/integrations/covers/cron-cover.webp`,
    light: `${BASE_PATH}/img/integrations/covers/cron-cover-light.webp`,
  },
  queues: {
    dark: `${BASE_PATH}/img/integrations/covers/queues-cover.png`,
    light: `${BASE_PATH}/img/integrations/covers/queues-cover-light.webp`,
  },
  stripe_sync_engine: {
    dark: `${BASE_PATH}/img/integrations/covers/stripe-cover.png`,
    light: `${BASE_PATH}/img/integrations/covers/stripe-cover-light.webp`,
  },
  grafana: {
    dark: `${BASE_PATH}/img/integrations/covers/grafana-cover.png`,
    light: `${BASE_PATH}/img/integrations/covers/grafana-cover-light.webp`,
  },
  'grafana-cloud': {
    dark: `${BASE_PATH}/img/integrations/covers/grafana-cover.png`,
    light: `${BASE_PATH}/img/integrations/covers/grafana-cover-light.webp`,
  },
}

interface ThemedImage {
  dark: string
  light?: string
}

// Resolves a cover image. `dark` is required; `light` is optional and only set when a distinct
// light-mode asset exists. Fallback (marketplace/partner) images are a single asset (dark only).
function getIntegrationImage(integration: IntegrationDefinition): ThemedImage | undefined {
  const featuredImage = FEATURED_INTEGRATION_IMAGES[integration.id]
  if (featuredImage) {
    return { dark: featuredImage.dark, light: featuredImage.light }
  }
  if (integration.files?.length) {
    const heroImage = integration.files[0]
    const src = typeof heroImage === 'string' ? heroImage : heroImage?.src
    if (src) return { dark: src }
  }
  return undefined
}

const CoverImage = ({
  image,
  alt,
  sizes,
  className,
}: {
  image: ThemedImage
  alt: string
  sizes?: string
  className?: string
}) => (
  <>
    <Image
      fill
      src={image.dark}
      alt={alt}
      sizes={sizes}
      className={cn('object-cover', image.light ? 'hidden dark:block' : '', className)}
    />
    {image.light && (
      <Image
        fill
        src={image.light}
        alt={alt}
        sizes={sizes}
        className={cn('object-cover dark:hidden', className)}
      />
    )}
  </>
)

interface MarketplaceFeaturedHeroGridProps {
  integrations: IntegrationDefinition[]
  installedIds: string[]
  primaryIntegrationId: string
  secondaryIntegrationIds: string[]
}

export const MarketplaceFeaturedHeroGrid = ({
  integrations,
  installedIds,
  primaryIntegrationId,
  secondaryIntegrationIds,
}: MarketplaceFeaturedHeroGridProps) => {
  const { ref } = useParams()
  const primaryIntegration = integrations.find((i) => i.id === primaryIntegrationId)
  const secondaryIntegrations = secondaryIntegrationIds
    .slice(0, 2)
    .map((id) => integrations.find((i) => i.id === id))
    .filter((i) => i !== undefined) as IntegrationDefinition[]

  if (!primaryIntegration) return null

  const primaryImage = getIntegrationImage(primaryIntegration)
  const primarySource = getMarketplaceSource(primaryIntegration)
  const primaryInstalled = installedIds.includes(primaryIntegration.id)

  return (
    <section className="@container">
      <div className="mb-2">
        <h2 className="text-sm">Featured integrations</h2>
      </div>
      <div className="grid grid-cols-1 @xl:grid-cols-2 @3xl:grid-cols-4 gap-3 items-stretch">
        <div className="col-span-1 @xl:col-span-2">
          <Link
            href={`/project/${ref}/integrations/${primaryIntegration.id}/overview`}
            className="block h-full rounded-md focus-ring"
          >
            <Card className="relative flex flex-row overflow-hidden h-full min-h-[168px] hover:border-stronger">
              <div className="relative z-10 flex flex-col gap-2.5 p-4 flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <IntegrationLogo integration={primaryIntegration} />
                  {primaryInstalled && <Badge variant="success">Installed</Badge>}
                </div>
                <div className="@xl:max-w-2/3">
                  <div className="mb-1 text-sm font-medium text-pretty">
                    {primaryIntegration.name}
                  </div>
                  {primaryIntegration.description && (
                    <p className="line-clamp-3 text-xs leading-snug text-foreground-light text-balance">
                      {primaryIntegration.description}
                    </p>
                  )}
                  <div className="text-xs flex items-center gap-1 text-foreground-lighter shrink-0 mt-4">
                    <span>Built by</span>
                    <span>{primaryIntegration.author?.name}</span>
                  </div>
                </div>
                <div className="flex-1" />
                <div className="flex items-center justify-between gap-2 pt-2.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <MarketplaceSourceBadge source={primarySource} />
                    {primaryIntegration.status && (
                      <Badge variant="warning">{primaryIntegration.status}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 left-auto w-2/5 @xl:w-3/5 shrink-0">
                {primaryImage && (
                  <>
                    <CoverImage
                      image={primaryImage}
                      alt={`${primaryIntegration.name} integration`}
                    />
                    <div className="absolute inset-0 bg-linear-to-r from-surface-100 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-radial-[ellipse_50%_100%_at_top_left] from-surface-100 to-transparent" />
                  </>
                )}
              </div>
            </Card>
          </Link>
        </div>

        {secondaryIntegrations.map((integration) => {
          const image = getIntegrationImage(integration)
          const source = getMarketplaceSource(integration)
          const isInstalled = installedIds.includes(integration.id)

          return (
            <div key={integration.id} className="col-span-1">
              <Link
                href={`/project/${ref}/integrations/${integration.id}/overview`}
                className="block h-full rounded-md focus-ring"
              >
                <Card className="flex flex-col overflow-hidden h-full hover:border-stronger">
                  <div className="hidden @xl:block relative w-full h-28 bg-black/90 dark:bg-black/50 shrink-0">
                    {image ? (
                      <CoverImage image={image} alt={`${integration.name} integration`} />
                    ) : (
                      <div className="flex h-full items-center p-6 justify-center">
                        {integration.icon({
                          className: 'w-8 h-8 object-contain aspect-square text-white',
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5 p-4 flex-1">
                    <div className="flex items-start justify-between">
                      <IntegrationLogo integration={integration} size="h-9 w-9" />
                      {isInstalled && <Badge variant="success">Installed</Badge>}
                    </div>
                    <div>
                      <div className="mb-1 text-sm font-medium">{integration.name}</div>
                      {integration.description && (
                        <p className="line-clamp-2 text-xs leading-snug text-foreground-light">
                          {integration.description}
                        </p>
                      )}
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center justify-between gap-2 pt-2.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <MarketplaceSourceBadge source={source} />
                        {integration.status && (
                          <Badge variant="warning">{integration.status}</Badge>
                        )}
                      </div>
                      <div className="text-xs flex items-center gap-1 text-foreground-lighter">
                        <span>Built by</span>
                        <span>{integration.author?.name}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}
