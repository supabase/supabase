import Link from 'next/link'
import type { ReactNode } from 'react'
import { Badge, cn, NavMenu, NavMenuItem } from 'ui'

import { getMarketplaceSource, MarketplaceSourceBadge } from './Marketplace.constants'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'

interface MarketplaceDetailHeroProps {
  integration: IntegrationDefinition
  description?: ReactNode
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
  description,
  subtitle,
  tabs,
}: MarketplaceDetailHeroProps) => {
  const source = getMarketplaceSource(integration)

  return (
    <div className={cn('@container border-b bg-surface-75 pt-10')}>
      <div className="mx-auto w-full px-6 xl:px-10 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white'
            )}
          >
            {integration.icon()}
          </div>
          <div>
            <div className="mb-1 flex flex-col flex-wrap @lg:flex-row @lg:items-center gap-2">
              <h1 className="m-0 text-3xl font-normal leading-tight tracking-tight">
                {integration.name}
              </h1>
              <BadgesComponent
                className="hidden @xl:flex"
                source={source}
                integration={integration}
              />
            </div>
            <div className="text-sm text-foreground-light">{subtitle}</div>
          </div>
        </div>
        <BadgesComponent className="flex @xl:hidden" source={source} integration={integration} />
        {description && (
          <p className="heading-subSection text-foreground-light truncate">{description}</p>
        )}

        {tabs.length > 0 && (
          <div className="mt-6 -mb-px">
            <NavMenu>
              {tabs.map((tab) => (
                <NavMenuItem key={tab.href} active={tab.active}>
                  <Link href={tab.href}>{tab.label}</Link>
                </NavMenuItem>
              ))}
            </NavMenu>
          </div>
        )}
      </div>
    </div>
  )
}
