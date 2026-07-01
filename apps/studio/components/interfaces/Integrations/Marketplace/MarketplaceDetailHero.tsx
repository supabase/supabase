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
} from 'ui-patterns/PageHeader'

import { getMarketplaceSource, MarketplaceSourceBadge } from './Marketplace.constants'
import { IntegrationLogo } from '@/components/interfaces/Integrations/Integration/IntegrationLogo'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'

interface MarketplaceDetailHeroProps {
  integration: IntegrationDefinition
  title: string
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
  title,
  subtitle,
  tabs,
}: MarketplaceDetailHeroProps) => {
  const source = getMarketplaceSource(integration)

  return (
    <PageHeader size="full" className={cn('@container')}>
      <PageHeaderMeta className="mx-auto w-full flex @xl:flex-col @xl:justify-start @xl:items-start gap-4">
        <div className="mx-auto w-full flex items-center gap-2 @lg:gap-4">
          <PageHeaderIcon>
            <IntegrationLogo integration={integration} size="w-10 h-10 @lg:w-14 @lg:h-14" />
          </PageHeaderIcon>
          <PageHeaderSummary className="gap-y-0.5">
            <div className="mb-1 flex flex-col flex-wrap @lg:flex-row @lg:items-center gap-2">
              <PageHeaderTitle className="heading-title truncate">{title}</PageHeaderTitle>
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
