import { IntegrationCard } from '@/components/interfaces/Integrations/Landing/IntegrationCard'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { BASE_PATH } from '@/lib/constants'

// Featured integration images
const FEATURED_INTEGRATION_IMAGES: Record<string, string> = {
  cron: `${BASE_PATH}/img/integrations/covers/cron-cover.webp`,
  queues: `${BASE_PATH}/img/integrations/covers/queues-cover.png`,
  stripe_wrapper: `${BASE_PATH}/img/integrations/covers/stripe-cover.png`,
  stripe_sync_engine: `${BASE_PATH}/img/integrations/covers/stripe-cover.png`,
  grafana: `${BASE_PATH}/img/integrations/covers/grafana-cover.png`,
}

function getIntegrationImage(integration: IntegrationDefinition) {
  let featured_image = FEATURED_INTEGRATION_IMAGES[integration.id]
  if (featured_image) {
    return featured_image
  }

  if (integration.files?.length) {
    const heroImage = integration?.files?.[0]
    return typeof heroImage === 'string' ? heroImage : (heroImage?.src ?? undefined)
  }
}

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
  const primaryIntegration = integrations.find((i) => i.id === primaryIntegrationId)
  const secondaryIntegrations = secondaryIntegrationIds
    .slice(0, 2)
    .map((id) => integrations.find((i) => i.id === id))
    .filter((i) => i !== undefined) as IntegrationDefinition[]

  if (!primaryIntegration) return null

  return (
    <section>
      <div className="mb-2">
        <h2 className="text-sm">Featured integrations</h2>
      </div>
      <div className="grid grid-cols-4 gap-4 items-stretch">
        {/* Primary card - 1/2 width (2/4) */}
        <div className="col-span-2">
          <IntegrationCard
            {...primaryIntegration}
            isInstalled={installedIds.includes(primaryIntegration.id)}
            featured={true}
            image={getIntegrationImage(primaryIntegration)}
          />
        </div>

        {/* Secondary cards - 1/4 width each */}
        {secondaryIntegrations.map((integration) => (
          <div key={integration.id} className="col-span-1">
            <IntegrationCard
              {...integration}
              isInstalled={installedIds.includes(integration.id)}
              featured={true}
              image={getIntegrationImage(integration)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
