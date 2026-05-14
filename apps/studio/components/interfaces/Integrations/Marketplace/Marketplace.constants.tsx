import {
  BarChart3,
  Boxes,
  Cable,
  Cpu,
  CreditCard,
  Database,
  KeyRound,
  Mail,
  Package2,
  Plug,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'

// Launch-partner pin list for the featured rail. Order here is the order
// shown. Stripe is the only first-party template in the set (id matches the
// static catalogue); the rest are marketplaceDB slugs and only render if the
// listing is published.
export const FEATURED_INTEGRATION_IDS = [
  'grafana',
  'stripe_sync_engine',
  'aikido',
  'aikido-security',
  'doppler',
  'cipherstash',
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
}

export const FEATURED_CATEGORIES: Array<{ slug: string; name: string }> = [
  { slug: 'observability', name: 'Observability' },
  { slug: 'security', name: 'Security' },
  { slug: 'billing', name: 'Billing' },
  { slug: 'devtools', name: 'DevTools' },
  { slug: 'ai_vectors', name: 'AI & Vectors' },
  { slug: 'storage', name: 'Storage' },
]

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

export type MarketplaceTier = 'Partner' | 'Official'

export const getMarketplaceTier = (integration: IntegrationDefinition): MarketplaceTier => {
  return integration.listingId ? 'Partner' : 'Official'
}
