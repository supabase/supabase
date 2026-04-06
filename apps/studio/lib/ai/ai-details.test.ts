import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getOrgAIDetails, getProjectAIDetails } from './ai-details'

vi.mock('@/data/organizations/organizations-query', () => ({
  getOrganizations: vi.fn(),
}))

vi.mock('@/data/projects/project-detail-query', () => ({
  getProjectDetail: vi.fn(),
}))

vi.mock('@/data/subscriptions/org-subscription-query', () => ({
  getOrgSubscription: vi.fn(),
}))

vi.mock('@/data/config/project-settings-v2-query', () => ({
  getProjectSettings: vi.fn(),
}))

vi.mock('@/hooks/misc/useOrgOptedIntoAi', () => ({
  getAiOptInLevel: vi.fn(),
}))

vi.mock('@/components/interfaces/Billing/Subscription/Subscription.utils', () => ({
  subscriptionHasHipaaAddon: vi.fn(),
}))

vi.mock('@/data/entitlements/entitlements-query', () => ({
  checkEntitlement: vi.fn(),
}))

vi.mock('@/data/fetchers', () => ({
  get: vi.fn(),
}))

const AUTH = 'Bearer token'
const HEADERS = { 'Content-Type': 'application/json', Authorization: AUTH }

describe('getOrgAIDetails', () => {
  let mockGetOrganizations: ReturnType<typeof vi.fn>
  let mockGetOrgSubscription: ReturnType<typeof vi.fn>
  let mockGetAiOptInLevel: ReturnType<typeof vi.fn>
  let mockSubscriptionHasHipaaAddon: ReturnType<typeof vi.fn>
  let mockCheckEntitlement: ReturnType<typeof vi.fn>
  let mockGet: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    const orgsQuery = await import('@/data/organizations/organizations-query')
    const subscriptionQuery = await import('@/data/subscriptions/org-subscription-query')
    const aiHook = await import('@/hooks/misc/useOrgOptedIntoAi')
    const subscriptionUtils =
      await import('@/components/interfaces/Billing/Subscription/Subscription.utils')
    const entitlementsQuery = await import('@/data/entitlements/entitlements-query')
    const fetchers = await import('@/data/fetchers')

    mockGetOrganizations = vi.mocked(orgsQuery.getOrganizations)
    mockGetOrgSubscription = vi.mocked(subscriptionQuery.getOrgSubscription)
    mockGetAiOptInLevel = vi.mocked(aiHook.getAiOptInLevel)
    mockSubscriptionHasHipaaAddon = vi.mocked(subscriptionUtils.subscriptionHasHipaaAddon)
    mockCheckEntitlement = vi.mocked(entitlementsQuery.checkEntitlement)
    mockGet = vi.mocked(fetchers.get)

    mockGetOrgSubscription.mockResolvedValue({ addons: [] })
    mockSubscriptionHasHipaaAddon.mockReturnValue(false)
    mockCheckEntitlement.mockResolvedValue({ hasAccess: false })
    mockGet.mockResolvedValue({ data: { signed: false } })
  })

  it('returns org-level fields', async () => {
    mockGetOrganizations.mockResolvedValue([
      { id: 1, slug: 'test-org', plan: { id: 'pro' }, opt_in_tags: [] },
    ])
    mockGetAiOptInLevel.mockReturnValue('schema')

    const result = await getOrgAIDetails({ orgSlug: 'test-org', authorization: AUTH })

    expect(result).toEqual({
      aiOptInLevel: 'schema',
      hasAccessToAdvanceModel: false,
      hasHipaaAddon: false,
      isDpaSigned: false,
      orgId: 1,
      planId: 'pro',
    })
  })

  it('returns hasAccessToAdvanceModel true when entitlement grants access', async () => {
    mockGetOrganizations.mockResolvedValue([
      { id: 1, slug: 'test-org', plan: { id: 'pro' }, opt_in_tags: [] },
    ])
    mockGetAiOptInLevel.mockReturnValue('schema')
    mockCheckEntitlement.mockResolvedValue({ hasAccess: true })

    const result = await getOrgAIDetails({ orgSlug: 'test-org', authorization: AUTH })

    expect(result.hasAccessToAdvanceModel).toBe(true)
  })

  it('returns hasHipaaAddon from subscription', async () => {
    mockGetOrganizations.mockResolvedValue([
      { id: 1, slug: 'test-org', plan: { id: 'enterprise' }, opt_in_tags: [] },
    ])
    mockGetAiOptInLevel.mockReturnValue('schema')
    mockSubscriptionHasHipaaAddon.mockReturnValue(true)

    const result = await getOrgAIDetails({ orgSlug: 'test-org', authorization: AUTH })

    expect(result.hasHipaaAddon).toBe(true)
  })

  it('returns isDpaSigned true when endpoint returns signed: true', async () => {
    mockGetOrganizations.mockResolvedValue([
      { id: 1, slug: 'test-org', plan: { id: 'pro' }, opt_in_tags: [] },
    ])
    mockGetAiOptInLevel.mockReturnValue('schema')
    mockGet.mockResolvedValue({ data: { signed: true } })

    const result = await getOrgAIDetails({ orgSlug: 'test-org', authorization: AUTH })

    expect(result.isDpaSigned).toBe(true)
  })

  it('returns isDpaSigned undefined when endpoint fails', async () => {
    mockGetOrganizations.mockResolvedValue([
      { id: 1, slug: 'test-org', plan: { id: 'pro' }, opt_in_tags: [] },
    ])
    mockGetAiOptInLevel.mockReturnValue('schema')
    mockGet.mockResolvedValue({ data: null, error: { message: 'Unauthorized' } })

    const result = await getOrgAIDetails({ orgSlug: 'test-org', authorization: AUTH })

    expect(result.isDpaSigned).toBeUndefined()
  })

  it('calls getAiOptInLevel with the matched org opt_in_tags', async () => {
    const opt_in_tags = ['AI_SQL_GENERATOR_OPT_IN']
    mockGetOrganizations.mockResolvedValue([
      { id: 1, slug: 'test-org', plan: { id: 'pro' }, opt_in_tags },
    ])
    mockGetAiOptInLevel.mockReturnValue('schema')

    await getOrgAIDetails({ orgSlug: 'test-org', authorization: AUTH })

    expect(mockGetAiOptInLevel).toHaveBeenCalledWith(opt_in_tags)
  })

  it('forwards authorization headers to all fetches', async () => {
    mockGetOrganizations.mockResolvedValue([
      { id: 1, slug: 'test-org', plan: { id: 'pro' }, opt_in_tags: [] },
    ])
    mockGetAiOptInLevel.mockReturnValue('schema')

    await getOrgAIDetails({ orgSlug: 'test-org', authorization: AUTH })

    expect(mockGetOrganizations).toHaveBeenCalledWith({ headers: HEADERS })
    expect(mockGetOrgSubscription).toHaveBeenCalledWith({ orgSlug: 'test-org' }, undefined, HEADERS)
  })

  it('finds the correct org when multiple orgs are returned', async () => {
    mockGetOrganizations.mockResolvedValue([
      { id: 1, slug: 'org-1', plan: { id: 'free' }, opt_in_tags: [] },
      { id: 2, slug: 'test-org', plan: { id: 'pro' }, opt_in_tags: [] },
    ])
    mockGetAiOptInLevel.mockReturnValue('schema')

    const result = await getOrgAIDetails({ orgSlug: 'test-org', authorization: AUTH })

    expect(result.orgId).toBe(2)
    expect(result.planId).toBe('pro')
  })
})

describe('getProjectAIDetails', () => {
  let mockGetProjectDetail: ReturnType<typeof vi.fn>
  let mockGetProjectSettings: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    const projectQuery = await import('@/data/projects/project-detail-query')
    const settingsQuery = await import('@/data/config/project-settings-v2-query')

    mockGetProjectDetail = vi.mocked(projectQuery.getProjectDetail)
    mockGetProjectSettings = vi.mocked(settingsQuery.getProjectSettings)
  })

  it('returns region and isSensitive', async () => {
    mockGetProjectDetail.mockResolvedValue({ ref: 'test-project', region: 'us-east-1' })
    mockGetProjectSettings.mockResolvedValue({ is_sensitive: false })

    const result = await getProjectAIDetails({ projectRef: 'test-project', authorization: AUTH })

    expect(result).toEqual({ region: 'us-east-1', isSensitive: false })
  })

  it('returns isSensitive true when project is marked sensitive', async () => {
    mockGetProjectDetail.mockResolvedValue({ ref: 'test-project', region: 'us-east-1' })
    mockGetProjectSettings.mockResolvedValue({ is_sensitive: true })

    const result = await getProjectAIDetails({ projectRef: 'test-project', authorization: AUTH })

    expect(result.isSensitive).toBe(true)
  })

  it('returns isSensitive undefined when project settings are unavailable', async () => {
    mockGetProjectDetail.mockResolvedValue({ ref: 'test-project', region: 'us-east-1' })
    mockGetProjectSettings.mockResolvedValue(undefined)

    const result = await getProjectAIDetails({ projectRef: 'test-project', authorization: AUTH })

    expect(result.isSensitive).toBeUndefined()
  })

  it('returns region undefined when project detail is unavailable', async () => {
    mockGetProjectDetail.mockResolvedValue(undefined)
    mockGetProjectSettings.mockResolvedValue({ is_sensitive: false })

    const result = await getProjectAIDetails({ projectRef: 'test-project', authorization: AUTH })

    expect(result.region).toBeUndefined()
  })

  it('forwards authorization headers to all fetches', async () => {
    mockGetProjectDetail.mockResolvedValue({ ref: 'test-project', region: 'us-east-1' })
    mockGetProjectSettings.mockResolvedValue({ is_sensitive: false })

    await getProjectAIDetails({ projectRef: 'test-project', authorization: AUTH })

    expect(mockGetProjectDetail).toHaveBeenCalledWith({ ref: 'test-project' }, undefined, HEADERS)
    expect(mockGetProjectSettings).toHaveBeenCalledWith(
      { projectRef: 'test-project' },
      undefined,
      HEADERS
    )
  })
})
