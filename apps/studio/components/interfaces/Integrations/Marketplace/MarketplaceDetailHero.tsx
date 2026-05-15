import { Handshake } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Badge, cn, IconPartners, NavMenu, NavMenuItem } from 'ui'

import { getMarketplaceSource } from './Marketplace.constants'
import { centeredContentClass } from './MarketplaceDetail'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'

interface MarketplaceDetailHeroProps {
  integration: IntegrationDefinition
  description?: ReactNode
  subtitle?: ReactNode
  tabs: Array<{ label: string; href: string; active: boolean }>
}

export const MarketplaceDetailHero = ({
  integration,
  description,
  subtitle,
  tabs,
}: MarketplaceDetailHeroProps) => {
  const source = getMarketplaceSource(integration)

  const BadgesComponent = ({ className }: { className?: string }) => {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {source === 'Partner' ? (
          <Badge variant="success">
            <IconPartners size={12} /> Partner
          </Badge>
        ) : source === 'Community' ? (
          <Badge>Community</Badge>
        ) : (
          <Badge>Official</Badge>
        )}
        {integration.status && <Badge variant="warning">{integration.status}</Badge>}
      </div>
    )
  }

  return (
    <div className={cn('@container border-b bg-surface-75 pt-10')}>
      <div className={cn(centeredContentClass, 'flex flex-col gap-4')}>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white'
            )}
          >
            {integration.icon()}
          </div>
          <div>
            <div className="mb-1 flex flex-col flex-wrap @lg:flex-row @lg:items-center gap-2">
              <h1 className="m-0 text-3xl font-normal leading-tight tracking-tight">
                {integration.name}
              </h1>
              <BadgesComponent className="hidden @xl:flex" />
            </div>
            <div className="text-[13.5px] text-foreground-light">{subtitle}</div>
          </div>
        </div>
        <BadgesComponent className="flex @xl:hidden" />
        {description && (
          <p className="m-0 max-w-[760px] text-lg leading-snug tracking-tight text-foreground">
            {description}
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
