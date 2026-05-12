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
  'doppler',
  'cipherstash',
] as const

// Integration mechanism types in the new marketplace nav. Maps to
// IntegrationDefinition['type'] when possible; templates is heuristic.
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
}

export const getCategoryIcon = (slug: string | null | undefined): LucideIcon => {
  if (!slug) return Boxes
  return CATEGORY_ICONS[slug] ?? Boxes
}

// Classify an integration into one of the four marketplace install mechanisms.
// Existing IntegrationDefinition.type covers oauth/postgres_extension/wrapper;
// 'template' is a heuristic — anything that ships a managed schema (e.g.
// stripe_sync_engine) is a template.
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

// Tier shown in the table/cards. The static catalogue doesn't carry a
// `partner` flag, so we infer:
// - listingId present (came from marketplaceDB) → Partner
// - wrapper/postgres_extension/internal → Official
export type MarketplaceTier = 'Partner' | 'Official'

export const getMarketplaceTier = (integration: IntegrationDefinition): MarketplaceTier => {
  return integration.listingId ? 'Partner' : 'Official'
}
