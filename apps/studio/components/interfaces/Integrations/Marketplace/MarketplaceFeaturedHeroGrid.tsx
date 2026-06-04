import { useParams } from 'common'
import Link from 'next/link'
import { Badge, Card } from 'ui'

import { IntegrationLogo } from '../Integration/IntegrationLogo'
import { getMarketplaceSource, MarketplaceSourceBadge } from './Marketplace.constants'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'

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
    .map((id) => integrations.find((i) => i.id === id))
    .filter((i) => i !== undefined) as IntegrationDefinition[]

  if (!primaryIntegration) return null

  const primarySource = getMarketplaceSource(primaryIntegration)
  const primaryInstalled = installedIds.includes(primaryIntegration.id)

  return (
    <section>
      <div className="mb-2">
        <h2 className="text-sm">Featured integrations</h2>
      </div>
      <div className="grid gap-3 grid-cols-1 @3xl:grid-cols-3">
        {/* Primary card - 2/3 width */}
        <Link
          href={`/project/${ref}/integrations/${primaryIntegration.id}/overview`}
          className="@3xl:col-span-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:ring-offset-1 focus-visible:ring-offset-background"
        >
          <Card className="flex h-full flex-col gap-4 hover:border-stronger p-6 bg-gradient-to-br from-surface-100 to-surface-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <IntegrationLogo integration={primaryIntegration} size="h-12 w-12" />
                <div>
                  <div className="font-semibold text-lg text-foreground">
                    {primaryIntegration.name}
                  </div>
                  <div className="text-xs text-foreground-lighter mt-1">
                    Monitoring & Observability
                  </div>
                </div>
              </div>
              {primaryInstalled && (
                <Badge variant="success" className="shrink-0">
                  Installed
                </Badge>
              )}
            </div>

            {primaryIntegration.description && (
              <p className="text-sm leading-relaxed text-foreground-light">
                {primaryIntegration.description}
              </p>
            )}

            <div className="flex-1" />

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <MarketplaceSourceBadge source={primarySource} />
                {primaryIntegration.status && (
                  <Badge variant="warning">{primaryIntegration.status}</Badge>
                )}
              </div>
              <span className="text-xs text-foreground-lighter">View integration →</span>
            </div>
          </Card>
        </Link>

        {/* Secondary cards - 1/3 width vertical stack */}
        <div className="flex flex-col gap-3">
          {secondaryIntegrations.map((integration) => {
            const isInstalled = installedIds.includes(integration.id)
            const source = getMarketplaceSource(integration)

            return (
              <Link
                key={integration.id}
                href={`/project/${ref}/integrations/${integration.id}/overview`}
                className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:ring-offset-1 focus-visible:ring-offset-background"
              >
                <Card className="flex flex-col gap-2.5 hover:border-stronger p-3 h-full">
                  <div className="flex items-start justify-between gap-2">
                    <IntegrationLogo integration={integration} size="h-8 w-8" />
                    {isInstalled && <Badge variant="success">Installed</Badge>}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{integration.name}</div>
                    {integration.description && (
                      <p className="line-clamp-2 text-xs leading-snug text-foreground-light mt-1">
                        {integration.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 pt-1 mt-auto">
                    <MarketplaceSourceBadge source={source} />
                    {integration.status && <Badge variant="warning">{integration.status}</Badge>}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
