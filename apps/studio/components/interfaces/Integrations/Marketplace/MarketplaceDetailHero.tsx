import Link from 'next/link'
import type { ReactNode } from 'react'
import { Badge, cn, NavMenu, NavMenuItem } from 'ui'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderIcon,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns'

import { getMarketplaceSource, MarketplaceSourceBadge } from './Marketplace.constants'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'

interface MarketplaceDetailHeroProps {
  integration: IntegrationDefinition
  subtitle?: ReactNode
  tabs: Array<{ label: string; href: string; active: boolean }>
}

interface BadgesComponentProps {
  className?: string
  source: ReturnType<typeof getMarketplaceSource>
  integration: IntegrationDefinition
}

const BadgesComponent = ({ className, source, integration }: BadgesComponentProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <MarketplaceSourceBadge source={source} />
      {integration.status && <Badge variant="warning">{integration.status}</Badge>}
    </div>
  )
}

export const MarketplaceDetailHero = ({
  integration,
  subtitle,
  tabs,
}: MarketplaceDetailHeroProps) => {
  const source = getMarketplaceSource(integration)

  // Determine page title, icon, and subtitle based on state
  const pageTitle = integration?.name || 'Integration not found'
  const pageIcon = integration ? (
    <div className="shrink-0 w-10 h-10 @lg:w-14 @lg:h-14 relative bg-white border rounded-md flex items-center justify-center">
      {integration.icon()}
    </div>
  ) : null

  return (
    <PageHeader size="full" className={cn('@container')}>
      <PageHeaderMeta className="mx-auto w-full flex @xl:flex-col @xl:justify-start @xl:items-start gap-4">
        <div className="mx-auto w-full flex items-center gap-2 @lg:gap-4">
          {pageIcon && <PageHeaderIcon>{pageIcon}</PageHeaderIcon>}
          <PageHeaderSummary className="gap-y-0.5">
            <div className="mb-1 flex flex-col flex-wrap @lg:flex-row @lg:items-center gap-2">
              <PageHeaderTitle className="heading-title truncate">{pageTitle}</PageHeaderTitle>
              <BadgesComponent
                className="hidden @xl:flex"
                source={source}
                integration={integration}
              />
            </div>
            <PageHeaderDescription className="hidden @lg:block">{subtitle}</PageHeaderDescription>
          </PageHeaderSummary>
        </div>
        <PageHeaderDescription className="@lg:hidden">{subtitle}</PageHeaderDescription>
        <BadgesComponent className="flex @xl:hidden" source={source} integration={integration} />
      </PageHeaderMeta>
      {tabs.length > 0 && (
        <PageHeaderNavigationTabs className="mx-auto w-full">
          <NavMenu>
            {tabs.map((tab) => (
              <NavMenuItem key={tab.href} active={tab.active}>
                <Link href={tab.href}>{tab.label}</Link>
              </NavMenuItem>
            ))}
          </NavMenu>
        </PageHeaderNavigationTabs>
      )}
    </PageHeader>
  )
}
