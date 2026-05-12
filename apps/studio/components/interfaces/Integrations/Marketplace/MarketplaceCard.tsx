import Link from 'next/link'
import { Badge, Card } from 'ui'

import { formatCategoryLabel, getMarketplaceTier } from './Marketplace.constants'
import { MarketplaceLogo } from './MarketplaceLogo'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface MarketplaceCardProps {
  integration: IntegrationDefinition
  isInstalled: boolean
}

export const MarketplaceCard = ({ integration, isInstalled }: MarketplaceCardProps) => {
  const { data: project } = useSelectedProjectQuery()
  const tier = getMarketplaceTier(integration)

  return (
    <Link href={`/project/${project?.ref}/integrations/${integration.id}/overview`}>
      <Card className="flex min-h-[168px] h-full flex-col gap-2.5 hover:border-stronger p-4">
        <div className="flex items-start justify-between">
          <MarketplaceLogo integration={integration} size="h-9 w-9" />
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
            {integration.status && (
              <Badge variant="warning" className="capitalize">
                {integration.status}
              </Badge>
            )}
            {tier === 'Partner' ? (
              <Badge variant="success">Partner</Badge>
            ) : (
              <Badge>Official</Badge>
            )}
          </div>
          <span className="text-[11.5px] text-foreground-lighter">
            {formatCategoryLabel(integration.categories?.[0])}
          </span>
        </div>
      </Card>
    </Link>
  )
}
