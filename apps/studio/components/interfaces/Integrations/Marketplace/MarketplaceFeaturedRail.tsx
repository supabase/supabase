import { BadgeCheck } from 'lucide-react'
import Link from 'next/link'

import { MarketplaceLogo } from './MarketplaceLogo'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface MarketplaceFeaturedRailProps {
  integrations: IntegrationDefinition[]
  installedIds: string[]
}

export const MarketplaceFeaturedRail = ({
  integrations,
  installedIds,
}: MarketplaceFeaturedRailProps) => {
  const { data: project } = useSelectedProjectQuery()

  if (integrations.length === 0) return null

  return (
    <section className="rounded-lg border bg-surface-200 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
        <h2 className="text-sm font-medium">Featured partners</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 @4xl:grid-cols-3 @6xl:grid-cols-5">
        {integrations.map((integration) => {
          const isInstalled = installedIds.includes(integration.id)
          return (
            <Link
              key={integration.id}
              href={`/project/${project?.ref}/integrations/${integration.id}/overview`}
              className="flex flex-col gap-2 rounded-md border bg-background p-3 transition-colors hover:border-stronger hover:bg-surface-100"
            >
              <div className="flex items-start justify-between">
                <MarketplaceLogo integration={integration} size="h-7 w-7" />
                {isInstalled && <BadgeCheck size={13} className="text-brand" />}
              </div>
              <div className="text-[13px] font-medium">{integration.name}</div>
              {integration.description && (
                <p className="line-clamp-2 text-[11.5px] leading-snug text-foreground-light">
                  {integration.description}
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
