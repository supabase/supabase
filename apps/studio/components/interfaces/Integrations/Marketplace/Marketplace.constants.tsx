import {
  BadgeCheck,
  BarChart3,
  Boxes,
  Cable,
  Cpu,
  CreditCard,
  Database,
  Fingerprint,
  KeyRound,
  Mail,
  MessageSquare,
  MousePointerClick,
  Package2,
  Plug,
  Server,
  ShieldCheck,
  Users,
  Webhook,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge, cn, IconPartners } from 'ui'

import type {
  IntegrationDefinition,
  MarketplaceSource,
} from '@/components/interfaces/Integrations/Landing/Integrations.constants'

export type { MarketplaceSource } from '@/components/interfaces/Integrations/Landing/Integrations.constants'

// Defines featured integrations and their order in the featured hero
export const FEATURED_INTEGRATION_IDS = [
  'grafana',
  'stripe_sync_engine',
  'aikido',
  'aikido-security',
  'doppler',
  'resend',
] as const

export type MarketplaceIntegrationType = 'oauth' | 'postgres_extension' | 'template' | 'wrapper'

export const INTEGRATION_TYPES: Array<{
  key: MarketplaceIntegrationType
  label: string
  icon: LucideIcon
}> = [
  { key: 'oauth', label: 'OAuth App', icon: Plug },
  { key: 'postgres_extension', label: 'Postgres Module', icon: Database },
  { key: 'template', label: 'Template', icon: Package2 },
  { key: 'wrapper', label: 'Wrapper', icon: Cable },
]

// Lucide icon per marketplace category slug. New categories fall back to a
// neutral icon (Boxes) so nothing breaks when the marketplaceDB is updated.
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  observability: BarChart3,
  security: ShieldCheck,
  billing: CreditCard,
  secrets: KeyRound,
  email: Mail,
  wrappers: Database,
  ai: Cpu,
  ai_vectors: Cpu,
  storage: Package2,
  postgres_extension: Database,
  wrapper: Cable,
  devtools: Wrench,
  auth: Fingerprint,
  'low-code': MousePointerClick,
  'data-platform': Server,
  api: Webhook,
  'caching-offline-first': Zap,
  messaging: MessageSquare,
}

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

export const getCategoryIcon = (slug: string | null | undefined): LucideIcon => {
  if (!slug) return Boxes
  return CATEGORY_ICONS[slug] ?? Boxes
}

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
  icon: LucideIcon | ((props: { className?: string }) => ReactNode)
}> = [
  { key: 'Official', label: 'Official', icon: BadgeCheck },
  { key: 'Partner', label: 'Partner', icon: IconPartners },
  { key: 'Community', label: 'Community', icon: Users },
]

export const getMarketplaceSource = (integration: IntegrationDefinition): MarketplaceSource => {
  if (integration.source) return integration.source
  return integration.listingId ? 'Partner' : 'Official'
}

export const MarketplaceSourceBadge = ({
  source,
  className,
}: {
  source: MarketplaceSource
  className?: string
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
      return <Badge className={className}>Official</Badge>
  }
}
