import { useParams } from 'common'
import Link from 'next/link'
import { Badge, Card } from 'ui'

import { IntegrationLogo } from '../Integration/IntegrationLogo'
import { getMarketplaceSource, MarketplaceSourceBadge } from './Marketplace.constants'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'

interface MarketplaceCardProps {
  integration: IntegrationDefinition
  isInstalled: boolean
}

export const MarketplaceCard = ({ integration, isInstalled }: MarketplaceCardProps) => {
  const { ref } = useParams()
  const source = getMarketplaceSource(integration)

  return (
    <Link
      href={`/project/${ref}/integrations/${integration.id}/overview`}
      className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:ring-offset-1 focus-visible:ring-offset-background"
    >
      <Card className="flex min-h-[168px] h-full flex-col gap-2.5 hover:border-stronger p-4">
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
            {integration.status && <Badge variant="warning">{integration.status}</Badge>}
          </div>
          <div className="text-xs flex items-center gap-1 text-foreground-lighter">
            <span>Built by</span>
            <span>{integration.author?.name}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
