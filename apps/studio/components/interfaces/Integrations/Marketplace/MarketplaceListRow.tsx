import { BadgeCheck, Settings } from 'lucide-react'
import Link from 'next/link'
import { Badge, Button } from 'ui'

import {
  getMarketplaceTier,
  getMarketplaceType,
  getMarketplaceTypeLabel,
} from './Marketplace.constants'
import { MarketplaceLogo } from './MarketplaceLogo'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface MarketplaceListRowProps {
  integration: IntegrationDefinition
  isInstalled: boolean
}

const ROW_TEMPLATE = '40px minmax(0,1fr) 100px 130px 110px'

export const MarketplaceListRow = ({ integration, isInstalled }: MarketplaceListRowProps) => {
  const { data: project } = useSelectedProjectQuery()
  const tier = getMarketplaceTier(integration)
  const installMechanism = getMarketplaceTypeLabel(getMarketplaceType(integration))

  return (
    <Link
      href={`/project/${project?.ref}/integrations/${integration.id}/overview`}
      className="grid items-center gap-4 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-100"
      style={{ gridTemplateColumns: ROW_TEMPLATE }}
    >
      <MarketplaceLogo integration={integration} size="h-8 w-8" />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-medium">{integration.name}</span>
          {tier === 'Partner' ? <Badge variant="success">Partner</Badge> : <Badge>Official</Badge>}
        </div>
        {integration.description && (
          <p className="mt-0.5 line-clamp-1 max-w-[600px] text-xs text-foreground-light">
            {integration.description}
          </p>
        )}
      </div>
      <span className="text-[11.5px] text-foreground-lighter">
        {integration.categories?.[0] ?? '—'}
      </span>
      <span className="font-mono text-[11.5px] text-foreground-lighter">{installMechanism}</span>
      <div className="flex items-center justify-end gap-2">
        {isInstalled && <BadgeCheck size={14} className="text-brand" />}
        <Button
          type={isInstalled ? 'outline' : 'default'}
          size="tiny"
          icon={isInstalled ? <Settings size={13} /> : undefined}
          // The whole row is a link — keep the button visually consistent but
          // non-interactive so we don't get nested navigation.
          tabIndex={-1}
          asChild
        >
          <span>{isInstalled ? 'Manage' : 'Install'}</span>
        </Button>
      </div>
    </Link>
  )
}

interface MarketplaceListHeaderProps {
  integrationsLabel?: string
}

export const MarketplaceListHeader = ({
  integrationsLabel = 'Integration',
}: MarketplaceListHeaderProps) => (
  <div
    className="grid gap-4 border-b bg-surface-100 px-4 py-2 font-mono text-[10.5px] uppercase tracking-wider text-foreground-lighter"
    style={{ gridTemplateColumns: ROW_TEMPLATE }}
  >
    <span />
    <span>{integrationsLabel}</span>
    <span>Category</span>
    <span>Type</span>
    <span />
  </div>
)
