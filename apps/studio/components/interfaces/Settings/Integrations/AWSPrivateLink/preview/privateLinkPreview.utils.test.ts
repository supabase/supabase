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
    expect(isPrivateLinkPreviewScenario('b5-studio-copy')).toBe(true)
  })

  it('rejects unknown values', () => {
    expect(isPrivateLinkPreviewScenario('nope')).toBe(false)
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
  it('marks marketplace plus PrivateLink as two jobs', () => {
    expect(getPrivateLinkPreviewScenarioConfig('marketplace-plus-privatelink').vercelCard).toBe(
      'marketplace-plus'
    )
  })

  it('keeps mixed rows installable, not marketplace', () => {
    expect(getPrivateLinkPreviewScenarioConfig('mixed-rows').vercelCard).toBe('not-connected')
  })

  it('keeps Vercel-initiated installable, with the Vercel cue on the PrivateLink row', () => {
    expect(getPrivateLinkPreviewScenarioConfig('vercel-initiated').vercelCard).toBe('not-connected')
  })

  it('marks B5 as Studio copy only', () => {
    const config = getPrivateLinkPreviewScenarioConfig('b5-studio-copy')
    expect(config.vercelCard).toBe('distinguish-billing')
    expect(config.b5Note).toMatch(/Vercel’s dashboard/)
  })
})

describe('isVercelMarketplacePreviewCard', () => {
  it('is true only for Marketplace card states', () => {
    expect(isVercelMarketplacePreviewCard('marketplace')).toBe(true)
    expect(isVercelMarketplacePreviewCard('marketplace-plus')).toBe(true)
    expect(isVercelMarketplacePreviewCard('distinguish-billing')).toBe(true)
    expect(isVercelMarketplacePreviewCard('not-connected')).toBe(false)
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
