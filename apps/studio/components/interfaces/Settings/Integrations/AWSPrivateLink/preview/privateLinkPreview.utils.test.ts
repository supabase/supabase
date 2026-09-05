import { describe, expect, it } from 'vitest'

import {
  getPreviewNavManagedBy,
  getPrivateLinkPreviewScenarioConfig,
  isPrivateLinkPreviewScenario,
  isVercelMarketplacePreviewCard,
} from './privateLinkPreview.constants'
import { getPreviewAccounts } from './privateLinkPreview.mocks'
import { MANAGED_BY } from '@/lib/constants/infrastructure'

describe('isPrivateLinkPreviewScenario', () => {
  it('accepts known scenarios', () => {
    expect(isPrivateLinkPreviewScenario('empty')).toBe(true)
    expect(isPrivateLinkPreviewScenario('vercel-initiated')).toBe(true)
    expect(isPrivateLinkPreviewScenario('private-hostname')).toBe(true)
  })

  it('rejects unknown and removed values', () => {
    expect(isPrivateLinkPreviewScenario('nope')).toBe(false)
    expect(isPrivateLinkPreviewScenario('mixed-statuses')).toBe(false)
    expect(isPrivateLinkPreviewScenario('b5-studio-copy')).toBe(false)
    expect(isPrivateLinkPreviewScenario('b6-private-hostname')).toBe(false)
  })
})

describe('getPreviewAccounts', () => {
  it('keeps Vercel and AWS-direct in one list for mixed rows', () => {
    const accounts = getPreviewAccounts('mixed-rows', 'abc')
    expect(accounts).toHaveLength(2)
    expect(accounts.some((account) => account.partner === 'vercel')).toBe(true)
    expect(accounts.some((account) => account.partner === undefined)).toBe(true)
  })

  it('omits a nickname on Vercel-initiated rows', () => {
    const [account] = getPreviewAccounts('vercel-initiated', 'abc')
    expect(account?.partner).toBe('vercel')
    expect(account?.account_name).toBeUndefined()
  })

  it('leaves marketplace without PrivateLink rows', () => {
    expect(getPreviewAccounts('marketplace')).toEqual([])
  })

  it('resets PrivateLink to an empty list', () => {
    expect(getPreviewAccounts('empty')).toEqual([])
  })
})

describe('getPrivateLinkPreviewScenarioConfig', () => {
  it('uses live Vercel and an empty PrivateLink list for reset', () => {
    const config = getPrivateLinkPreviewScenarioConfig('empty')
    expect(config.vercelCard).toBe('live')
    expect(config.showPrivateHostname).toBe(false)
    expect(config.showRestrictPublicAccess).toBe(false)
    expect(config.prefillAwsAccountId).toBeUndefined()
  })

  it('keeps AWS-direct on plain Install', () => {
    expect(getPrivateLinkPreviewScenarioConfig('aws-direct-connected').vercelCard).toBe(
      'not-connected'
    )
  })

  it('marks marketplace plus PrivateLink as two jobs', () => {
    expect(getPrivateLinkPreviewScenarioConfig('marketplace-plus-privatelink').vercelCard).toBe(
      'marketplace-plus'
    )
  })

  it('puts an initiated-from-Vercel cue on Install for Vercel-initiated and mixed rows', () => {
    expect(getPrivateLinkPreviewScenarioConfig('vercel-initiated').vercelCard).toBe(
      'install-from-vercel'
    )
    expect(getPrivateLinkPreviewScenarioConfig('mixed-rows').vercelCard).toBe('install-from-vercel')
    expect(getPrivateLinkPreviewScenarioConfig('private-hostname').vercelCard).toBe(
      'install-from-vercel'
    )
  })

  it('keeps paste-account-ID on plain Install', () => {
    expect(getPrivateLinkPreviewScenarioConfig('vercel-fallback').vercelCard).toBe('not-connected')
  })
})

describe('isVercelMarketplacePreviewCard', () => {
  it('is true only for Marketplace card states', () => {
    expect(isVercelMarketplacePreviewCard('marketplace')).toBe(true)
    expect(isVercelMarketplacePreviewCard('marketplace-plus')).toBe(true)
    expect(isVercelMarketplacePreviewCard('not-connected')).toBe(false)
    expect(isVercelMarketplacePreviewCard('install-from-vercel')).toBe(false)
    expect(isVercelMarketplacePreviewCard('live')).toBe(false)
  })
})

describe('getPreviewNavManagedBy', () => {
  it('fakes Vercel Marketplace managed_by when the nav chrome flag is on', () => {
    expect(getPreviewNavManagedBy(MANAGED_BY.SUPABASE, true)).toBe(MANAGED_BY.VERCEL_MARKETPLACE)
    expect(getPreviewNavManagedBy(undefined, true)).toBe(MANAGED_BY.VERCEL_MARKETPLACE)
  })

  it('leaves the real managed_by alone when the flag is off', () => {
    expect(getPreviewNavManagedBy(MANAGED_BY.SUPABASE, false)).toBe(MANAGED_BY.SUPABASE)
    expect(getPreviewNavManagedBy(undefined, false)).toBeUndefined()
  })
})
