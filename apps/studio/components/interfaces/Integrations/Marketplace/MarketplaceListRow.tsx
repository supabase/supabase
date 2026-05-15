import { useRouter } from 'next/router'
import { Badge, TableCell, TableHead, TableRow } from 'ui'

import {
  formatCategoryLabel,
  getMarketplaceSource,
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

const HIDE_BELOW_XL = 'hidden @3xl:table-cell'
const HIDE_BELOW_4XL = 'hidden @4xl:table-cell'

export const MarketplaceListRow = ({ integration, isInstalled }: MarketplaceListRowProps) => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const source = getMarketplaceSource(integration)
  const installMechanism = getMarketplaceTypeLabel(getMarketplaceType(integration))
  const href = `/project/${project?.ref}/integrations/${integration.id}/overview`

  return (
    <TableRow
      onClick={() => router.push(href)}
      className="cursor-pointer transition-colors hover:bg-surface-100 [&>td]:py-2 @lg:[&>td]:py-2.5"
    >
      <TableCell className="w-10 pr-0 @lg:w-12">
        <MarketplaceLogo integration={integration} size="h-7 w-7 @lg:h-8 @lg:w-8" />
      </TableCell>

      <TableCell>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span className="text-sm font-medium @lg:text-sm">{integration.name}</span>
            {integration.status && (
              <Badge variant="warning" className="capitalize">
                {integration.status}
              </Badge>
            )}
            {source === 'Partner' ? (
              <Badge variant="success">Partner</Badge>
            ) : source === 'Community' ? (
              <Badge>Community</Badge>
            ) : (
              <Badge>Official</Badge>
            )}
          </div>
          {integration.description && (
            <p className="mt-0.5 line-clamp-1 max-w-[600px] text-xs text-foreground-light">
              {integration.description}
            </p>
          )}
        </div>
      </TableCell>

      <TableCell className={`w-28 text-xs text-foreground-lighter ${HIDE_BELOW_XL}`}>
        {formatCategoryLabel(integration.categories?.[0]) || '—'}
      </TableCell>

      <TableCell className={`w-32 font-mono text-xs text-foreground-lighter ${HIDE_BELOW_4XL}`}>
        {installMechanism}
      </TableCell>

      <TableCell className={`w-40 text-foreground-lighter ${HIDE_BELOW_4XL}`}>
        {integration.author?.name || '—'}
      </TableCell>

      <TableCell className="w-24">
        {isInstalled ? <Badge variant="success">Installed</Badge> : null}
      </TableCell>
    </TableRow>
  )
}

interface MarketplaceListHeaderProps {
  integrationsLabel?: string
}

export const MarketplaceListHeader = ({
  integrationsLabel = 'Integration',
}: MarketplaceListHeaderProps) => (
  <TableRow>
    <TableHead className="w-10 pr-0 @lg:w-12" />
    <TableHead>{integrationsLabel}</TableHead>
    <TableHead className={`w-28 ${HIDE_BELOW_XL}`}>Category</TableHead>
    <TableHead className={`w-40 ${HIDE_BELOW_4XL}`}>Type</TableHead>
    <TableHead className={`w-40 ${HIDE_BELOW_4XL}`}>Built by</TableHead>
    <TableHead className="w-32"></TableHead>
  </TableRow>
)
