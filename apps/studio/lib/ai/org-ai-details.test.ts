import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getOrgAIDetails } from './org-ai-details'

vi.mock('data/organizations/organizations-query', () => ({
  getOrganizations: vi.fn(),
}))

vi.mock('data/projects/project-detail-query', () => ({
  getProjectDetail: vi.fn(),
}))

vi.mock('data/subscriptions/org-subscription-query', () => ({
  getOrgSubscription: vi.fn(),
}))

vi.mock('data/config/project-settings-v2-query', () => ({
  getProjectSettings: vi.fn(),
}))

vi.mock('hooks/misc/useOrgOptedIntoAi', () => ({
  getAiOptInLevel: vi.fn(),
}))

vi.mock('components/interfaces/Billing/Subscription/Subscription.utils', () => ({
  subscriptionHasHipaaAddon: vi.fn(),
}))

vi.mock('data/entitlements/entitlements-query', () => ({
  checkEntitlement: vi.fn(),
}))

vi.mock('data/fetchers', () => ({
  get: vi.fn(),
}))

describe('ai/org-ai-details', () => {
  let mockGetOrganizations: ReturnType<typeof vi.fn>
  let mockGetProjectDetail: ReturnType<typeof vi.fn>
  let mockGetOrgSubscription: ReturnType<typeof vi.fn>
  let mockGetProjectSettings: ReturnType<typeof vi.fn>
  let mockGetAiOptInLevel: ReturnType<typeof vi.fn>
  let mockSubscriptionHasHipaaAddon: ReturnType<typeof vi.fn>
  let mockCheckEntitlement: ReturnType<typeof vi.fn>
  let mockGet: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    const orgsQuery = await import('data/organizations/organizations-query')
    const projectQuery = await import('data/projects/project-detail-query')
    const subscriptionQuery = await import('data/subscriptions/org-subscription-query')
    const settingsQuery = await import('data/config/project-settings-v2-query')
    const aiHook = await import('hooks/misc/useOrgOptedIntoAi')
    const subscriptionUtils =
      await import('components/interfaces/Billing/Subscription/Subscription.utils')
    const entitlementsQuery = await import('data/entitlements/entitlements-query')
    const fetchers = await import('data/fetchers')

    mockGetOrganizations = vi.mocked(orgsQuery.getOrganizations)
    mockGetProjectDetail = vi.mocked(projectQuery.getProjectDetail)
    mockGetOrgSubscription = vi.mocked(subscriptionQuery.getOrgSubscription)
    mockGetProjectSettings = vi.mocked(settingsQuery.getProjectSettings)
    mockGetAiOptInLevel = vi.mocked(aiHook.getAiOptInLevel)
    mockSubscriptionHasHipaaAddon = vi.mocked(subscriptionUtils.subscriptionHasHipaaAddon)
    mockCheckEntitlement = vi.mocked(entitlementsQuery.checkEntitlement)
    mockGet = vi.mocked(fetchers.get)

    // Default mocks for subscription/settings (no HIPAA)
    mockGetOrgSubscription.mockResolvedValue({ addons: [] })
    mockGetProjectSettings.mockResolvedValue({ is_sensitive: false })
    mockSubscriptionHasHipaaAddon.mockReturnValue(false)
    mockCheckEntitlement.mockResolvedValue({ hasAccess: false })
    mockGet.mockResolvedValue({ data: { signed: false, checked_at: '2026-01-01T00:00:00.000Z' } })
  })

  describe('getOrgAIDetails', () => {
    it('should fetch organizations and project details', async () => {
      const mockOrg = {
        id: 1,
        slug: 'test-org',
        plan: { id: 'pro' },
        opt_in_tags: [],
      }
      const mockProject = {
        id: 1,
        organization_id: 1,
        ref: 'test-project',
      }

      mockGetOrganizations.mockResolvedValue([mockOrg])
      mockGetProjectDetail.mockResolvedValue(mockProject)
      mockGetAiOptInLevel.mockReturnValue('full')

      await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer token',
        projectRef: 'test-project',
      })

      expect(mockGetOrganizations).toHaveBeenCalledWith({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token',
        },
      })
      expect(mockGetProjectDetail).toHaveBeenCalledWith({ ref: 'test-project' }, undefined, {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      })
    })

    it('should return AI opt-in level and assistant advance-model flag', async () => {
      const mockOrg = {
        id: 1,
        slug: 'test-org',
        plan: { id: 'free' },
        opt_in_tags: ['AI_SQL_GENERATOR_OPT_IN'],
      }
      const mockProject = {
        organization_id: 1,
        ref: 'test-project',
      }

      mockGetOrganizations.mockResolvedValue([mockOrg])
      mockGetProjectDetail.mockResolvedValue(mockProject)
      mockGetAiOptInLevel.mockReturnValue('schema_only')

      const result = await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer token',
        projectRef: 'test-project',
      })

      expect(result).toEqual({
        aiOptInLevel: 'schema_only',
        hasAccessToAdvanceModel: false,
        isHipaaEnabled: false,
        isDpaSigned: false,
        isEuRegion: false,
        orgId: 1,
        planId: 'free',
      })
    })

    it('should set hasAccessToAdvanceModel when entitlement grants access', async () => {
      const mockOrg = {
        id: 1,
        slug: 'test-org',
        plan: { id: 'pro' },
        opt_in_tags: [],
      }
      const mockProject = {
        organization_id: 1,
      }

      mockGetOrganizations.mockResolvedValue([mockOrg])
      mockGetProjectDetail.mockResolvedValue(mockProject)
      mockGetAiOptInLevel.mockReturnValue('full')
      mockCheckEntitlement.mockResolvedValue({ hasAccess: true })

      const result = await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer token',
        projectRef: 'test-project',
      })

      expect(result.hasAccessToAdvanceModel).toBe(true)
    })

    it('should throw error when project and org do not match', async () => {
      const mockOrg = {
        id: 1,
        slug: 'test-org',
        plan: { id: 'pro' },
      }
      const mockProject = {
        organization_id: 2, // Different org ID
      }

      mockGetOrganizations.mockResolvedValue([mockOrg])
      mockGetProjectDetail.mockResolvedValue(mockProject)

      await expect(
        getOrgAIDetails({
          orgSlug: 'test-org',
          authorization: 'Bearer token',
          projectRef: 'test-project',
        })
      ).rejects.toThrow('Project and organization do not match')
    })

    it('should handle org not found', async () => {
      const mockProject = {
        organization_id: 1,
      }

      mockGetOrganizations.mockResolvedValue([]) // No orgs
      mockGetProjectDetail.mockResolvedValue(mockProject)

      await expect(
        getOrgAIDetails({
          orgSlug: 'non-existent-org',
          authorization: 'Bearer token',
          projectRef: 'test-project',
        })
      ).rejects.toThrow('Project and organization do not match')
    })

    it('should call getAiOptInLevel with org opt_in_tags', async () => {
      const mockOptInTags = ['AI_SQL_GENERATOR_OPT_IN', 'AI_DATA_GENERATOR_OPT_IN']
      const mockOrg = {
        id: 1,
        slug: 'test-org',
        plan: { id: 'pro' },
        opt_in_tags: mockOptInTags,
      }
      const mockProject = {
        organization_id: 1,
      }

      mockGetOrganizations.mockResolvedValue([mockOrg])
      mockGetProjectDetail.mockResolvedValue(mockProject)
      mockGetAiOptInLevel.mockReturnValue('full')

      await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer token',
        projectRef: 'test-project',
      })

      expect(mockGetAiOptInLevel).toHaveBeenCalledWith(mockOptInTags)
    })

    it('should include authorization header when provided', async () => {
      const mockOrg = {
        id: 1,
        slug: 'test-org',
        plan: { id: 'pro' },
      }
      const mockProject = {
        organization_id: 1,
      }

      mockGetOrganizations.mockResolvedValue([mockOrg])
      mockGetProjectDetail.mockResolvedValue(mockProject)
      mockGetAiOptInLevel.mockReturnValue('full')

      await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer custom-token',
        projectRef: 'test-project',
      })

      expect(mockGetOrganizations).toHaveBeenCalledWith({
        headers: expect.objectContaining({
          Authorization: 'Bearer custom-token',
        }),
      })
      expect(mockGetProjectDetail).toHaveBeenCalledWith(
        expect.anything(),
        undefined,
        expect.objectContaining({
          Authorization: 'Bearer custom-token',
        })
      )
    })

    it('should fetch multiple organizations and find correct one', async () => {
      const mockOrgs = [
        { id: 1, slug: 'org-1', plan: { id: 'free' } },
        { id: 2, slug: 'test-org', plan: { id: 'pro' } },
        { id: 3, slug: 'org-3', plan: { id: 'team' } },
      ]
      const mockProject = {
        organization_id: 2,
      }

      mockGetOrganizations.mockResolvedValue(mockOrgs)
      mockGetProjectDetail.mockResolvedValue(mockProject)
      mockGetAiOptInLevel.mockReturnValue('full')
      mockCheckEntitlement.mockResolvedValue({ hasAccess: true })

      const result = await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer token',
        projectRef: 'test-project',
      })

      expect(result.hasAccessToAdvanceModel).toBe(true)
    })

    it('should return isHipaaEnabled true when subscription has HIPAA addon and project is sensitive', async () => {
      const mockOrg = {
        id: 1,
        slug: 'test-org',
        plan: { id: 'enterprise' },
        opt_in_tags: [],
      }
      const mockProject = { organization_id: 1 }

      mockGetOrganizations.mockResolvedValue([mockOrg])
      mockGetProjectDetail.mockResolvedValue(mockProject)
      mockGetAiOptInLevel.mockReturnValue('schema')
      mockSubscriptionHasHipaaAddon.mockReturnValue(true)
      mockGetProjectSettings.mockResolvedValue({ is_sensitive: true })

      const result = await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer token',
        projectRef: 'test-project',
      })

      expect(result.isHipaaEnabled).toBe(true)
    })

    it('should return isHipaaEnabled false when subscription has HIPAA addon but project is not sensitive', async () => {
      const mockOrg = {
        id: 1,
        slug: 'test-org',
        plan: { id: 'enterprise' },
        opt_in_tags: [],
      }
      const mockProject = { organization_id: 1 }

      mockGetOrganizations.mockResolvedValue([mockOrg])
      mockGetProjectDetail.mockResolvedValue(mockProject)
      mockGetAiOptInLevel.mockReturnValue('schema')
      mockSubscriptionHasHipaaAddon.mockReturnValue(true)
      mockGetProjectSettings.mockResolvedValue({ is_sensitive: false })

      const result = await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer token',
        projectRef: 'test-project',
      })

      expect(result.isHipaaEnabled).toBe(false)
    })

    it('should return isHipaaEnabled false when project is sensitive but no HIPAA addon', async () => {
      const mockOrg = {
        id: 1,
        slug: 'test-org',
        plan: { id: 'pro' },
        opt_in_tags: [],
      }
      const mockProject = { organization_id: 1 }

      mockGetOrganizations.mockResolvedValue([mockOrg])
      mockGetProjectDetail.mockResolvedValue(mockProject)
      mockGetAiOptInLevel.mockReturnValue('schema')
      mockSubscriptionHasHipaaAddon.mockReturnValue(false)
      mockGetProjectSettings.mockResolvedValue({ is_sensitive: true })

      const result = await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer token',
        projectRef: 'test-project',
      })

      expect(result.isHipaaEnabled).toBe(false)
    })

    it('should return isDpaSigned true when the DPA signed endpoint returns signed: true', async () => {
      const mockOrg = { id: 1, slug: 'test-org', plan: { id: 'pro' }, opt_in_tags: [] }
      const mockProject = { organization_id: 1, region: 'us-east-1' }

      mockGetOrganizations.mockResolvedValue([mockOrg])
      mockGetProjectDetail.mockResolvedValue(mockProject)
      mockGetAiOptInLevel.mockReturnValue('schema')
      mockGet.mockResolvedValue({ data: { signed: true, checked_at: '2026-01-01T00:00:00.000Z' } })

      const result = await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer token',
        projectRef: 'test-project',
      })

      expect(result.isDpaSigned).toBe(true)
    })

    it('should return isDpaSigned false when the DPA signed endpoint returns signed: false', async () => {
      const mockOrg = { id: 1, slug: 'test-org', plan: { id: 'pro' }, opt_in_tags: [] }
      const mockProject = { organization_id: 1, region: 'us-east-1' }

      mockGetOrganizations.mockResolvedValue([mockOrg])
      mockGetProjectDetail.mockResolvedValue(mockProject)
      mockGetAiOptInLevel.mockReturnValue('schema')
      mockGet.mockResolvedValue({ data: { signed: false, checked_at: '2026-01-01T00:00:00.000Z' } })

      const result = await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer token',
        projectRef: 'test-project',
      })

      expect(result.isDpaSigned).toBe(false)
    })

    it('should return isDpaSigned false when the DPA signed endpoint fails', async () => {
      const mockOrg = { id: 1, slug: 'test-org', plan: { id: 'pro' }, opt_in_tags: [] }
      const mockProject = { organization_id: 1, region: 'us-east-1' }

      mockGetOrganizations.mockResolvedValue([mockOrg])
      mockGetProjectDetail.mockResolvedValue(mockProject)
      mockGetAiOptInLevel.mockReturnValue('schema')
      mockGet.mockResolvedValue({ data: null, error: { message: 'Unauthorized' } })

      const result = await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer token',
        projectRef: 'test-project',
      })

      expect(result.isDpaSigned).toBe(false)
    })

    it('should return isEuRegion true for EU database regions', async () => {
      const mockOrg = { id: 1, slug: 'test-org', plan: { id: 'pro' }, opt_in_tags: [] }
      const mockProject = { organization_id: 1, region: 'eu-west-2' }

      mockGetOrganizations.mockResolvedValue([mockOrg])
      mockGetProjectDetail.mockResolvedValue(mockProject)
      mockGetAiOptInLevel.mockReturnValue('schema')

      const result = await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer token',
        projectRef: 'test-project',
      })

      expect(result.isEuRegion).toBe(true)
    })

    it('should return isEuRegion false for non-EU database regions', async () => {
      const mockOrg = { id: 1, slug: 'test-org', plan: { id: 'pro' }, opt_in_tags: [] }
      const mockProject = { organization_id: 1, region: 'ap-southeast-1' }

      mockGetOrganizations.mockResolvedValue([mockOrg])
      mockGetProjectDetail.mockResolvedValue(mockProject)
      mockGetAiOptInLevel.mockReturnValue('schema')

      const result = await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer token',
        projectRef: 'test-project',
      })

      expect(result.isEuRegion).toBe(false)
    })

    it('should fetch subscription and project settings with authorization headers', async () => {
      const mockOrg = {
        id: 1,
        slug: 'test-org',
        plan: { id: 'pro' },
      }
      const mockProject = { organization_id: 1 }

      mockGetOrganizations.mockResolvedValue([mockOrg])
      mockGetProjectDetail.mockResolvedValue(mockProject)
      mockGetAiOptInLevel.mockReturnValue('schema')

      await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer token',
        projectRef: 'test-project',
      })

      const expectedHeaders = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      }

      expect(mockGetOrgSubscription).toHaveBeenCalledWith(
        { orgSlug: 'test-org' },
        undefined,
        expectedHeaders
      )
      expect(mockGetProjectSettings).toHaveBeenCalledWith(
        { projectRef: 'test-project' },
        undefined,
        expectedHeaders
      )
    })
  })
})
