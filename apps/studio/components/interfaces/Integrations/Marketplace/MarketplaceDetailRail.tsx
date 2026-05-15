import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from 'ui'

import { getMarketplaceType, getMarketplaceTypeLabel } from './Marketplace.constants'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'

interface RailRowProps {
  label: string
  value: ReactNode
  href?: string
  mono?: boolean
}

const RailRow = ({ label, value, href, mono }: RailRowProps) => {
  const valueCls = cn(
    'flex items-center gap-1 text-sm',
    href ? 'text-brand' : 'text-foreground',
    mono && 'font-mono'
  )
  const content = (
    <>
      {value}
      {href && <ArrowUpRight size={11} />}
    </>
  )
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-foreground-lighter">{label}</div>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className={valueCls}>
          {content}
        </a>
      ) : (
        <div className={valueCls}>{content}</div>
      )}
    </div>
  )
}

interface RailGroupProps {
  title: string
  children: ReactNode
}

const RailGroup = ({ title, children }: RailGroupProps) => (
  <div className="flex flex-col gap-3 border-b pb-4 last:border-b-0">
    <div className="font-mono text-[10px] uppercase tracking-widest text-foreground-lighter">
      {title}
    </div>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
)

interface MarketplaceDetailRailProps {
  integration: IntegrationDefinition
  isInstalled: boolean
}

const tryHostname = (url: string | null | undefined) => {
  if (!url) return undefined
  try {
    return new URL(url).hostname
  } catch {
    return undefined
  }
}

export const MarketplaceDetailRail = ({ integration, isInstalled }: MarketplaceDetailRailProps) => {
  const typeLabel = getMarketplaceTypeLabel(getMarketplaceType(integration))
  const docsUrl = integration.docsUrl ?? undefined
  const siteUrl = integration.siteUrl ?? undefined
  const siteHost = tryHostname(siteUrl)

  return (
    <aside className="sticky top-6 flex flex-col gap-4 self-start text-sm">
      <RailGroup title="About">
        <RailRow label="Type" value={typeLabel} />
        <RailRow label="Built by" value={integration.author?.name || 'Supabase'} />
        {isInstalled && <RailRow label="Status" value="Installed" />}
      </RailGroup>

      {(docsUrl || siteUrl) && (
        <RailGroup title="Links">
          {docsUrl && <RailRow label="Documentation" value="Read the docs" href={docsUrl} />}
          {siteUrl && siteHost && <RailRow label="Website" value={siteHost} href={siteUrl} />}
        </RailGroup>
      )}
    </aside>
  )
}
