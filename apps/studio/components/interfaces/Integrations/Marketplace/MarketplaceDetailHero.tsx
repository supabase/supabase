import Link from 'next/link'
import type { ReactNode } from 'react'
import { Badge, cn, NavMenu, NavMenuItem } from 'ui'

import { getMarketplaceTier } from './Marketplace.constants'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'

interface MarketplaceDetailHeroProps {
  integration: IntegrationDefinition
  /** Lede paragraph below the title */
  lede?: ReactNode
  /** Subtitle line (category, version, install state) */
  subtitle?: ReactNode
  /** Tabs to render below the hero; href change handles activation */
  tabs: Array<{ label: string; href: string; active: boolean }>
  isInstalled?: boolean
}

export const MarketplaceDetailHero = ({
  integration,
  lede,
  subtitle,
  tabs,
  isInstalled,
}: MarketplaceDetailHeroProps) => {
  const tier = getMarketplaceTier(integration)

  return (
    <div className="border-b bg-surface-75 px-6 pt-10 xl:px-10">
      <div className="mx-auto w-full max-w-[1080px]">
        <div className="mb-4 flex items-center gap-4">
          <div
            className={cn(
              'relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white'
            )}
          >
            {integration.icon()}
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h1 className="m-0 text-3xl font-normal leading-tight tracking-tight">
                {integration.name}
              </h1>
              {tier === 'Partner' ? (
                <Badge variant="success">Partner</Badge>
              ) : (
                <Badge>Official</Badge>
              )}
              {isInstalled && <Badge variant="success">Installed</Badge>}
              {integration.status && <Badge variant="warning">{integration.status}</Badge>}
            </div>
            <div className="text-[13.5px] text-foreground-light">{subtitle}</div>
          </div>
        </div>
        {lede && (
          <p className="m-0 max-w-[760px] text-lg leading-snug tracking-tight text-foreground">
            {lede}
          </p>
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
