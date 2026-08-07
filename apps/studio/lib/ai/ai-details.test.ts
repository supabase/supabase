import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAIDetails } from './ai-details'

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

const AUTH = 'Bearer token'
const HEADERS = { 'Content-Type': 'application/json', Authorization: AUTH }
const ORG_SLUG = 'test-org'
const PROJECT_REF = 'test-project'

describe('getAIDetails', () => {
  let mockGetOrganizations: ReturnType<typeof vi.fn>
  let mockGetOrgSubscription: ReturnType<typeof vi.fn>
  let mockGetProjectDetail: ReturnType<typeof vi.fn>
  let mockGetProjectSettings: ReturnType<typeof vi.fn>
  let mockGetAiOptInLevel: ReturnType<typeof vi.fn>
  let mockSubscriptionHasHipaaAddon: ReturnType<typeof vi.fn>
  let mockCheckEntitlement: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    const orgsQuery = await import('@/data/organizations/organizations-query')
    const subscriptionQuery = await import('@/data/subscriptions/org-subscription-query')
    const projectQuery = await import('@/data/projects/project-detail-query')
    const settingsQuery = await import('@/data/config/project-settings-v2-query')
    const aiHook = await import('@/hooks/misc/useOrgOptedIntoAi')
    const subscriptionUtils =
      await import('@/components/interfaces/Billing/Subscription/Subscription.utils')
    const entitlementsQuery = await import('@/data/entitlements/entitlements-query')

    mockGetOrganizations = vi.mocked(orgsQuery.getOrganizations)
    mockGetOrgSubscription = vi.mocked(subscriptionQuery.getOrgSubscription)
    mockGetProjectDetail = vi.mocked(projectQuery.getProjectDetail)
    mockGetProjectSettings = vi.mocked(settingsQuery.getProjectSettings)
    mockGetAiOptInLevel = vi.mocked(aiHook.getAiOptInLevel)
    mockSubscriptionHasHipaaAddon = vi.mocked(subscriptionUtils.subscriptionHasHipaaAddon)
    mockCheckEntitlement = vi.mocked(entitlementsQuery.checkEntitlement)

    mockGetOrganizations.mockResolvedValue([
      { id: 1, slug: ORG_SLUG, plan: { id: 'pro' }, opt_in_tags: [] },
    ])
    mockGetProjectDetail.mockResolvedValue({
      ref: PROJECT_REF,
      region: 'us-east-1',
      organization_id: 1,
    })
    mockGetProjectSettings.mockResolvedValue({ is_sensitive: false })
    mockGetOrgSubscription.mockResolvedValue({ addons: [] })
    mockSubscriptionHasHipaaAddon.mockReturnValue(false)
    mockCheckEntitlement.mockResolvedValue({ hasAccess: false })
    mockGetAiOptInLevel.mockReturnValue('schema')
  })

  it('returns the resolved posture when the project belongs to the org', async () => {
    const result = await getAIDetails({
      orgSlug: ORG_SLUG,
      projectRef: PROJECT_REF,
      authorization: AUTH,
    })

    expect(result).toEqual({
      aiOptInLevel: 'schema',
      hasAccessToAdvanceModel: false,
      hasHipaaAddon: false,
      orgId: 1,
      planId: 'pro',
      region: 'us-east-1',
      isSensitive: false,
    })
  })

  it('calls getAiOptInLevel with the matched org opt_in_tags', async () => {
    const opt_in_tags = ['AI_SQL_GENERATOR_OPT_IN']
    mockGetOrganizations.mockResolvedValue([
      { id: 1, slug: ORG_SLUG, plan: { id: 'pro' }, opt_in_tags },
    ])

    await getAIDetails({ orgSlug: ORG_SLUG, projectRef: PROJECT_REF, authorization: AUTH })

    expect(mockGetAiOptInLevel).toHaveBeenCalledWith(opt_in_tags)
  })

  it('returns hasAccessToAdvanceModel true when the entitlement grants access', async () => {
    mockCheckEntitlement.mockResolvedValue({ hasAccess: true })

    const result = await getAIDetails({
      orgSlug: ORG_SLUG,
      projectRef: PROJECT_REF,
      authorization: AUTH,
    })

    expect(result.hasAccessToAdvanceModel).toBe(true)
  })

  it('finds the correct org when multiple orgs are returned', async () => {
    mockGetOrganizations.mockResolvedValue([
      { id: 1, slug: 'org-1', plan: { id: 'free' }, opt_in_tags: [] },
      { id: 2, slug: ORG_SLUG, plan: { id: 'pro' }, opt_in_tags: [] },
    ])
    mockGetProjectDetail.mockResolvedValue({
      ref: PROJECT_REF,
      region: 'us-east-1',
      organization_id: 2,
    })

    const result = await getAIDetails({
      orgSlug: ORG_SLUG,
      projectRef: PROJECT_REF,
      authorization: AUTH,
    })

    expect(result.orgId).toBe(2)
    expect(result.planId).toBe('pro')
  })

  it('forwards authorization headers to all fetches', async () => {
    await getAIDetails({ orgSlug: ORG_SLUG, projectRef: PROJECT_REF, authorization: AUTH })

    expect(mockGetOrganizations).toHaveBeenCalledWith({ headers: HEADERS })
    expect(mockGetOrgSubscription).toHaveBeenCalledWith({ orgSlug: ORG_SLUG }, undefined, HEADERS)
    expect(mockCheckEntitlement).toHaveBeenCalledWith(
      ORG_SLUG,
      'assistant.advance_model',
      undefined,
      HEADERS
    )
    expect(mockGetProjectDetail).toHaveBeenCalledWith(
      { ref: PROJECT_REF, skipWake: true },
      undefined,
      HEADERS
    )
    expect(mockGetProjectSettings).toHaveBeenCalledWith(
      { projectRef: PROJECT_REF },
      undefined,
      HEADERS
    )
  })

  describe('when the project does not belong to the org', () => {
    beforeEach(() => {
      mockGetOrganizations.mockResolvedValue([
        { id: 1, slug: ORG_SLUG, plan: { id: 'pro' }, opt_in_tags: ['AI_SQL_GENERATOR_OPT_IN'] },
        { id: 2, slug: 'other-org', plan: { id: 'free' }, opt_in_tags: [] },
      ])
      mockGetProjectDetail.mockResolvedValue({
        ref: PROJECT_REF,
        region: 'us-east-1',
        organization_id: 2,
      })
      mockGetAiOptInLevel.mockReturnValue('schema_and_log_and_data')
      mockCheckEntitlement.mockResolvedValue({ hasAccess: true })
    })

    it('falls back to the most restrictive posture', async () => {
      const result = await getAIDetails({
        orgSlug: ORG_SLUG,
        projectRef: PROJECT_REF,
        authorization: AUTH,
      })

      expect(result.aiOptInLevel).toBe('disabled')
      expect(result.hasAccessToAdvanceModel).toBe(false)
      expect(result.orgId).toBeUndefined()
      expect(result.planId).toBeUndefined()
    })

    it('leaves hasHipaaAddon undefined so tracing checks fail closed', async () => {
      mockSubscriptionHasHipaaAddon.mockReturnValue(false)

      const result = await getAIDetails({
        orgSlug: ORG_SLUG,
        projectRef: PROJECT_REF,
        authorization: AUTH,
      })

      expect(result.hasHipaaAddon).toBeUndefined()
    })
  })

  it('falls back to the most restrictive posture when the org slug matches no org', async () => {
    mockGetOrganizations.mockResolvedValue([])

    const result = await getAIDetails({
      orgSlug: ORG_SLUG,
      projectRef: PROJECT_REF,
      authorization: AUTH,
    })

    expect(result.aiOptInLevel).toBe('disabled')
    expect(result.orgId).toBeUndefined()
  })

  it('falls back to the most restrictive posture when project detail is unavailable', async () => {
    mockGetProjectDetail.mockResolvedValue(undefined)

    const result = await getAIDetails({
      orgSlug: ORG_SLUG,
      projectRef: PROJECT_REF,
      authorization: AUTH,
    })

    expect(result.aiOptInLevel).toBe('disabled')
    expect(result.region).toBeUndefined()
  })

  describe('HIPAA organizations', () => {
    beforeEach(() => {
      mockSubscriptionHasHipaaAddon.mockReturnValue(true)
      mockGetAiOptInLevel.mockReturnValue('schema_and_log_and_data')
    })

    it('disables the opt-in level for a sensitive project', async () => {
      mockGetProjectSettings.mockResolvedValue({ is_sensitive: true })

      const result = await getAIDetails({
        orgSlug: ORG_SLUG,
        projectRef: PROJECT_REF,
        authorization: AUTH,
      })

      expect(result.aiOptInLevel).toBe('disabled')
      expect(result.hasHipaaAddon).toBe(true)
    })

    it('disables the opt-in level when project sensitivity is unknown', async () => {
      mockGetProjectSettings.mockResolvedValue(undefined)

      const result = await getAIDetails({
        orgSlug: ORG_SLUG,
        projectRef: PROJECT_REF,
        authorization: AUTH,
      })

      expect(result.aiOptInLevel).toBe('disabled')
    })

    it('keeps the opt-in level for a project explicitly marked not sensitive', async () => {
      mockGetProjectSettings.mockResolvedValue({ is_sensitive: false })

      const result = await getAIDetails({
        orgSlug: ORG_SLUG,
        projectRef: PROJECT_REF,
        authorization: AUTH,
      })

      expect(result.aiOptInLevel).toBe('schema_and_log_and_data')
    })
  })

  it('keeps the opt-in level for a sensitive project outside a HIPAA org', async () => {
    mockSubscriptionHasHipaaAddon.mockReturnValue(false)
    mockGetProjectSettings.mockResolvedValue({ is_sensitive: true })

    const result = await getAIDetails({
      orgSlug: ORG_SLUG,
      projectRef: PROJECT_REF,
      authorization: AUTH,
    })

    expect(result.aiOptInLevel).toBe('schema')
  })
})
