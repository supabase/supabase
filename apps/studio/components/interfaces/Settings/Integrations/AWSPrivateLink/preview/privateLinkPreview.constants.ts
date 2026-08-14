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
  | 'mixed-statuses'
  | 'vercel-initiated'
  | 'marketplace'
  | 'marketplace-plus-privatelink'
  | 'vercel-fallback'
  | 'mixed-rows'
  | 'b6-private-hostname'
  | 'b5-studio-copy'

export type PrivateLinkPreviewSource = 'real-api' | 'mocked-platform'

export type PrivateLinkPreviewVercelCard =
  | 'live'
  | 'not-connected'
  | 'marketplace'
  | 'marketplace-plus'
  | 'distinguish-billing'

export type PrivateLinkPreviewScenarioConfig = {
  id: PrivateLinkPreviewScenario
  label: string
  source: PrivateLinkPreviewSource
  description: string
  vercelCard: PrivateLinkPreviewVercelCard
  showPrivateHostname: boolean
  showRestrictPublicAccess: boolean
  prefillAwsAccountId?: string
  b5Note?: string
}

export const PRIVATE_LINK_PREVIEW_SCENARIOS: PrivateLinkPreviewScenarioConfig[] = [
  {
    id: 'empty',
    label: 'Empty (reset)',
    source: 'real-api',
    description:
      'Honest empty PrivateLink list. Vercel section is live. No mocked rows, hostname, or prefill.',
    vercelCard: 'live',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'aws-direct-connected',
    label: 'AWS-direct, connected',
    source: 'real-api',
    description: 'User-owned AWS account. No Vercel cue.',
    vercelCard: 'not-connected',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'aws-direct-waiting',
    label: 'AWS-direct, just added (Waiting)',
    source: 'real-api',
    description: 'Post-add accept moment. Toast, list warning, row second line.',
    vercelCard: 'not-connected',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'aws-direct-expired',
    label: 'AWS-direct, Expired',
    source: 'real-api',
    description: '12-hour window missed.',
    vercelCard: 'not-connected',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'mixed-statuses',
    label: 'Mixed statuses',
    source: 'real-api',
    description: 'Waiting, connected, and expired in one list.',
    vercelCard: 'not-connected',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'vercel-initiated',
    label: 'Vercel-initiated, no Studio install',
    source: 'mocked-platform',
    description: 'Vercel-created PrivateLink row. Install remains available for env sync.',
    vercelCard: 'not-connected',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'marketplace',
    label: 'Marketplace / env sync, no PrivateLink',
    source: 'mocked-platform',
    description: 'Vercel card is billing and env sync. PrivateLink is empty.',
    vercelCard: 'marketplace',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'marketplace-plus-privatelink',
    label: 'Marketplace plus PrivateLink',
    source: 'mocked-platform',
    description: 'Two cards, two jobs. Partner cue on the PrivateLink row.',
    vercelCard: 'marketplace-plus',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'vercel-fallback',
    label: 'Vercel fallback (paste account ID)',
    source: 'mocked-platform',
    description: 'Same add-connection sheet, including optional IAM role.',
    vercelCard: 'not-connected',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
    prefillAwsAccountId: VERCEL_PREVIEW_AWS_ACCOUNT_ID,
  },
  {
    id: 'mixed-rows',
    label: 'Mixed rows',
    source: 'mocked-platform',
    description: 'Vercel cue and AWS-direct in one list. Install remains available. Not a split.',
    vercelCard: 'not-connected',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
  },
  {
    id: 'b6-private-hostname',
    label: 'B6: private hostname and restrict public access',
    source: 'mocked-platform',
    description: 'Open Connect and Database Settings → Network restrictions.',
    vercelCard: 'not-connected',
    showPrivateHostname: true,
    showRestrictPublicAccess: true,
  },
  {
    id: 'b5-studio-copy',
    label: 'B5: Studio copy only (not Vercel UI)',
    source: 'mocked-platform',
    description:
      'If Vercel shows two Supabase rows, Studio copy distinguishes billing from the private path.',
    vercelCard: 'distinguish-billing',
    showPrivateHostname: false,
    showRestrictPublicAccess: false,
    b5Note:
      'B5 is Vercel’s dashboard. We are not faking it. This scenario only tries Studio copy: Marketplace manages billing; PrivateLink below is the private database path.',
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
  return (
    vercelCard === 'marketplace' ||
    vercelCard === 'marketplace-plus' ||
    vercelCard === 'distinguish-billing'
  )
}

export function getPreviewNavManagedBy(
  managedBy: ManagedBy | undefined,
  showVercelMarketplaceNav: boolean
): ManagedBy | undefined {
  if (showVercelMarketplaceNav) return MANAGED_BY.VERCEL_MARKETPLACE
  return managedBy
}
