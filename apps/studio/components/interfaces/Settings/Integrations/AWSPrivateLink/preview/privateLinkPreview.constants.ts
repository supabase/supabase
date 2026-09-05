/**
 * Prototype-only. Delete this folder when splitting Track B into real PRs.
 * Enable with `?privatelinkPreview=1`. Off by default. Do not ship.
 */

import { MANAGED_BY, type ManagedBy } from '@/lib/constants/infrastructure'

export const PRIVATE_LINK_PREVIEW_QUERY = 'privatelinkPreview'
export const PRIVATE_LINK_PREVIEW_SCENARIO_QUERY = 'privatelinkPreviewScenario'
export const PRIVATE_LINK_PREVIEW_STORAGE_KEY = 'supabase.privatelink-preview'
export const PRIVATE_LINK_PREVIEW_SCENARIO_STORAGE_KEY = 'supabase.privatelink-preview-scenario'

export const VERCEL_PREVIEW_AWS_ACCOUNT_ID = '111122223333'
export const AWS_DIRECT_PREVIEW_ACCOUNT_ID = '123456789012'
export const PRIVATE_LINK_PREVIEW_HOSTNAME = 'db.privatelink.supabase.com'

export type PrivateLinkPreviewScenario =
  | 'empty'
  | 'aws-direct-connected'
  | 'aws-direct-waiting'
  | 'aws-direct-expired'
  | 'vercel-initiated'
  | 'marketplace'
  | 'marketplace-plus-privatelink'
  | 'vercel-fallback'
  | 'mixed-rows'
  | 'private-hostname'

export type PrivateLinkPreviewGroup = 'reset' | 'aws' | 'vercel'

export type PrivateLinkPreviewVercelCard =
  | 'live'
  | 'not-connected'
  | 'install-from-vercel'
  | 'marketplace'
  | 'marketplace-plus'

export type PrivateLinkPreviewScenarioConfig = {
  id: PrivateLinkPreviewScenario
  label: string
  group: PrivateLinkPreviewGroup
  description: string
  vercelCard: PrivateLinkPreviewVercelCard
  showPrivateHostname: boolean
  showRestrictPublicAccess: boolean
  prefillAwsAccountId?: string
}

export const PRIVATE_LINK_PREVIEW_GROUPS: { id: PrivateLinkPreviewGroup; label: string }[] = [
  { id: 'reset', label: 'Reset' },
  { id: 'aws', label: 'AWS-direct' },
  { id: 'vercel', label: 'Vercel' },
]

export const PRIVATE_LINK_PREVIEW_SCENARIOS: PrivateLinkPreviewScenarioConfig[] = [
  {
    id: 'empty',
    label: 'Empty',
    group: 'reset',
    description: 'Live Vercel section. Empty PrivateLink list.',
    vercelCard: 'live',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'aws-direct-connected',
    label: 'Connected',
    group: 'aws',
    description: 'Plain Install on Vercel. User-owned PrivateLink row, no Vercel mark.',
    vercelCard: 'not-connected',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'aws-direct-waiting',
    label: 'Waiting',
    group: 'aws',
    description: 'Accept-in-AWS list warning. Replay the add toast from this panel.',
    vercelCard: 'not-connected',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'aws-direct-expired',
    label: 'Expired',
    group: 'aws',
    description: '12-hour window missed. Destructive list warning.',
    vercelCard: 'not-connected',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'vercel-initiated',
    label: 'From Vercel',
    group: 'vercel',
    description: 'Install still available. Vercel section points at PrivateLink below.',
    vercelCard: 'install-from-vercel',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    group: 'vercel',
    description: 'Env sync is done. No PrivateLink row.',
    vercelCard: 'marketplace',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'marketplace-plus-privatelink',
    label: 'Marketplace + PrivateLink',
    group: 'vercel',
    description: 'Env sync is done. Vercel section points at PrivateLink below.',
    vercelCard: 'marketplace-plus',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'vercel-fallback',
    label: 'Paste account ID',
    group: 'vercel',
    description: 'Plain Install. Add connection prefills Vercel’s AWS account ID.',
    vercelCard: 'not-connected',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
    prefillAwsAccountId: VERCEL_PREVIEW_AWS_ACCOUNT_ID,
  },
  {
    id: 'mixed-rows',
    label: 'Mixed rows',
    group: 'vercel',
    description: 'From-Vercel cue on Install, plus a user-owned AWS row in the same list.',
    vercelCard: 'install-from-vercel',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'private-hostname',
    label: 'Private hostname',
    group: 'vercel',
    description: 'Same as From Vercel. Open Connect and Database Settings → Network restrictions.',
    vercelCard: 'install-from-vercel',
    showPrivateHostname: true,
    showRestrictPublicAccess: true,
  },
]

export function isPrivateLinkPreviewScenario(value: string): value is PrivateLinkPreviewScenario {
  return PRIVATE_LINK_PREVIEW_SCENARIOS.some((scenario) => scenario.id === value)
}

export function getPrivateLinkPreviewScenarioConfig(
  id: PrivateLinkPreviewScenario
): PrivateLinkPreviewScenarioConfig {
  const config = PRIVATE_LINK_PREVIEW_SCENARIOS.find((scenario) => scenario.id === id)
  return config ?? PRIVATE_LINK_PREVIEW_SCENARIOS[0]
}

export function isVercelMarketplacePreviewCard(vercelCard: PrivateLinkPreviewVercelCard): boolean {
  return vercelCard === 'marketplace' || vercelCard === 'marketplace-plus'
}

export function getPreviewNavManagedBy(
  managedBy: ManagedBy | undefined,
  showVercelMarketplaceNav: boolean
): ManagedBy | undefined {
  if (showVercelMarketplaceNav) return MANAGED_BY.VERCEL_MARKETPLACE
  return managedBy
}
