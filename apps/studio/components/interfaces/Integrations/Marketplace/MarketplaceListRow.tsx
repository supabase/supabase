import Link from 'next/link'
import { Badge, TableCell, TableHead, TableRow } from 'ui'

import { IntegrationLogo } from '../Integration/IntegrationLogo'
import {
  formatCategoryLabel,
  getMarketplaceSource,
  getMarketplaceType,
  getMarketplaceTypeLabel,
  MarketplaceSourceBadge,
} from './Marketplace.constants'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface MarketplaceListRowProps {
  integration: IntegrationDefinition
  isInstalled: boolean
}

const HIDE_BELOW_XL = 'hidden @3xl:table-cell'
const HIDE_BELOW_4XL = 'hidden @4xl:table-cell'

export const MarketplaceListRow = ({ integration, isInstalled }: MarketplaceListRowProps) => {
  const { data: project } = useSelectedProjectQuery()
  const source = getMarketplaceSource(integration)
  const installMechanism = getMarketplaceTypeLabel(getMarketplaceType(integration))
  const href = `/project/${project?.ref}/integrations/${integration.id}/overview`

  return (
    <TableRow className="group relative transition-colors hover:bg-surface-100 [&>td]:py-2 @lg:[&>td]:py-2.5">
      <TableCell className="w-10 pr-0 @lg:w-12">
        <IntegrationLogo integration={integration} size="h-7 w-7 @lg:h-8 @lg:w-8" />
      </TableCell>

      <TableCell>
        <Link
          href={href}
          className="block w-full hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded-md"
        >
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <div className="relative z-10 text-sm font-medium @lg:text-sm after:absolute after:-inset-y-2 after:left-0 after:right-[calc(100%+6px)] after:content-[''] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground">
              {integration.name}
            </div>
            <div className="relative z-10">
              <MarketplaceSourceBadge source={source} />
              {integration.status && <Badge variant="warning">{integration.status}</Badge>}
            </div>
          </div>
          {integration.description && (
            <p className="mt-0.5 line-clamp-1 max-w-[600px] text-xs text-foreground-light">
              {integration.description}
            </p>
          )}
        </Link>
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
