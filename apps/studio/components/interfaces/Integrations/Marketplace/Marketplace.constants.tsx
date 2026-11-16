import {
  CableIcon,
  DatabaseIcon,
  Package2Icon,
  PlugIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode, SVGProps } from 'react'
import { Badge, cn, IconPartners, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import type {
  IntegrationDefinition,
  MarketplaceSource,
} from '@/components/interfaces/Integrations/Landing/Integrations.constants'

/**
 * Filled Lucide `badge-check` (ISC) — proper filled conversion of Lucide’s
 * scalloped badge, with the check knocked out via evenodd.
 */
export const OfficialBadgeCheckIcon = ({
  className,
  size = 16,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden="true"
    className={className}
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.814 2.772c.392-.028.78-.023 1.169.035a5.03 5.03 0 0 1 2.637 1.254 5.07 5.07 0 0 1 1.49 2.527c.122.494.153 1.001.126 1.507l-.008.091c.369.324.702.684.966 1.099.478.75.75 1.602.796 2.49a5.03 5.03 0 0 1-.807 2.957 5.1 5.1 0 0 1-.955 1.082c.032.468.013.928-.074 1.391a4.98 4.98 0 0 1-1.836 2.986 5.05 5.05 0 0 1-2.327.998 5.5 5.5 0 0 1-1.164.038 5.3 5.3 0 0 1-1.037.929 5 5 0 0 1-2.949.844 5.03 5.03 0 0 1-2.636-.854 5.6 5.6 0 0 1-.961-.848l-.06-.069a5.5 5.5 0 0 1-1.389-.075 4.98 4.98 0 0 1-2.986-1.836 5.05 5.05 0 0 1-.998-2.327 5.5 5.5 0 0 1-.038-1.163 5.1 5.1 0 0 1-1.093-1.292 5.06 5.06 0 0 1-.642-3.237 5 5 0 0 1 1.035-2.408 5.7 5.7 0 0 1 .7-.719 5.4 5.4 0 0 1 .144-1.683 5.01 5.01 0 0 1 4.118-3.684 5.5 5.5 0 0 1 1.151-.033c.207-.236.425-.46.67-.656.838-.666 1.902-1.094 2.981-1.109a5.3 5.3 0 0 1 1.746.255 5.1 5.1 0 0 1 2.231 1.51m-1.521 6.521-3.045 3.045c-.153.135-.342.128-.496 0l-1.045-1.045a1.06 1.06 0 0 0-.447-.259 1.01 1.01 0 0 0-.967.258 1.01 1.01 0 0 0-.259.967c.046.172.138.318.259.448l2 2c.186.173.413.283.669.292.283.011.54-.101.745-.292l4-4c.121-.129.212-.275.259-.447a1.01 1.01 0 0 0-.258-.967 1.01 1.01 0 0 0-.967-.259 1.06 1.06 0 0 0-.448.259"
    />
  </svg>
)

export const OfficialSourceMark = ({
  className,
  size = 16,
  tooltip = 'Built by Supabase',
}: {
  className?: string
  size?: number
  tooltip?: string
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span
        tabIndex={0}
        className={cn('inline-flex shrink-0 text-blue-900', className)}
        aria-label={tooltip}
      >
        <OfficialBadgeCheckIcon size={size} />
      </span>
    </TooltipTrigger>
    <TooltipContent side="bottom">{tooltip}</TooltipContent>
  </Tooltip>
)

export const MarketplaceBuiltBy = ({
  authorName,
  source,
  className,
  markSize = 12,
}: {
  authorName?: string | null
  source: MarketplaceSource
  className?: string
  markSize?: number
}) => (
  <span className={cn('inline-flex items-center gap-1', className)}>
    <span>{authorName || 'Supabase'}</span>
    {source === 'Official' && <OfficialSourceMark size={markSize} tooltip="Official" />}
  </span>
)

export { getCategoryIcon, CATEGORY_ICONS } from 'common/marketplace-categories'

export type { MarketplaceSource } from '@/components/interfaces/Integrations/Landing/Integrations.constants'

// Defines featured integrations and their order in the featured hero
export const FEATURED_INTEGRATION_IDS = [
  'grafana',
  'grafana-cloud',
  'cron',
  'queues',
  'stripe_sync_engine',
  'data_api',
] as const

export type MarketplaceIntegrationType = 'oauth' | 'postgres_extension' | 'template' | 'wrapper'

export const INTEGRATION_TYPES: Array<{
  key: MarketplaceIntegrationType
  label: string
  icon: LucideIcon
}> = [
  { key: 'oauth', label: 'OAuth App', icon: PlugIcon },
  { key: 'postgres_extension', label: 'Postgres Module', icon: DatabaseIcon },
  { key: 'template', label: 'Template', icon: Package2Icon },
  { key: 'wrapper', label: 'Wrapper', icon: CableIcon },
]

export const FEATURED_CATEGORIES: Array<{ slug: string; name: string }> = [
  { slug: 'observability', name: 'Observability' },
  { slug: 'security', name: 'Security' },
  { slug: 'billing', name: 'Billing' },
  { slug: 'devtools', name: 'DevTools' },
  { slug: 'ai_vectors', name: 'AI & Vectors' },
  { slug: 'storage', name: 'Storage' },
]

// Categories excluded from the filter dropdown — they either overlap with
// dedicated filter groups (type/source) or are unused in the current catalogue.
export const EXCLUDED_CATEGORY_SLUGS = new Set([
  'agencies',
  'foreign-data-wrapper',
  'app-templates',
])

export const formatCategoryLabel = (
  slug: string | null | undefined,
  categoryOptions?: Array<{ slug: string; name: string }>
): string => {
  if (!slug) return ''
  const pinned = FEATURED_CATEGORIES.find((c) => c.slug === slug)
  if (pinned) return pinned.name
  const remote = categoryOptions?.find((c) => c.slug === slug)
  if (remote) return remote.name
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export const getMarketplaceType = (
  integration: IntegrationDefinition
): MarketplaceIntegrationType => {
  if (integration.type === 'wrapper') return 'wrapper'
  if (integration.type === 'postgres_extension') return 'postgres_extension'
  if (integration.id === 'stripe_sync_engine') return 'template'
  return 'oauth'
}

export const getMarketplaceTypeLabel = (type: MarketplaceIntegrationType): string =>
  INTEGRATION_TYPES.find((t) => t.key === type)?.label ?? type

export const MARKETPLACE_SOURCES: Array<{
  key: MarketplaceSource
  label: string
  icon: LucideIcon | ((props: { className?: string; size?: number }) => ReactNode)
}> = [
  { key: 'Official', label: 'Official', icon: OfficialBadgeCheckIcon },
  { key: 'Partner', label: 'Partner', icon: IconPartners },
  { key: 'Community', label: 'Community', icon: UsersIcon },
]

export const getMarketplaceSource = (integration: IntegrationDefinition): MarketplaceSource => {
  if (integration.source) return integration.source
  return integration.listingId ? 'Partner' : 'Official'
}

export const MarketplaceSourceBadge = ({
  source,
  className,
  officialTooltip = 'Built by Supabase',
}: {
  source: MarketplaceSource
  className?: string
  /** Tooltip for the Official mark. Cards / Built by use "Official". */
  officialTooltip?: string
}) => {
  switch (source) {
    case 'Partner':
      return (
        <Badge className={cn('border-foreground-lighter/50', className)}>
          <IconPartners size={10} /> Partner
        </Badge>
      )
    case 'Community':
      return <Badge className={className}>Community</Badge>
    case 'Official':
      return <OfficialSourceMark className={className} size={16} tooltip={officialTooltip} />
  }
}
