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

describe('ai/org-ai-details', () => {
  let mockGetOrganizations: ReturnType<typeof vi.fn>
  let mockGetProjectDetail: ReturnType<typeof vi.fn>
  let mockGetOrgSubscription: ReturnType<typeof vi.fn>
  let mockGetProjectSettings: ReturnType<typeof vi.fn>
  let mockGetAiOptInLevel: ReturnType<typeof vi.fn>
  let mockSubscriptionHasHipaaAddon: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    const orgsQuery = await import('data/organizations/organizations-query')
    const projectQuery = await import('data/projects/project-detail-query')
    const subscriptionQuery = await import('data/subscriptions/org-subscription-query')
    const settingsQuery = await import('data/config/project-settings-v2-query')
    const aiHook = await import('hooks/misc/useOrgOptedIntoAi')
    const subscriptionUtils = await import(
      'components/interfaces/Billing/Subscription/Subscription.utils'
    )

    mockGetOrganizations = vi.mocked(orgsQuery.getOrganizations)
    mockGetProjectDetail = vi.mocked(projectQuery.getProjectDetail)
    mockGetOrgSubscription = vi.mocked(subscriptionQuery.getOrgSubscription)
    mockGetProjectSettings = vi.mocked(settingsQuery.getProjectSettings)
    mockGetAiOptInLevel = vi.mocked(aiHook.getAiOptInLevel)
    mockSubscriptionHasHipaaAddon = vi.mocked(subscriptionUtils.subscriptionHasHipaaAddon)

    // Default mocks for subscription/settings (no HIPAA)
    mockGetOrgSubscription.mockResolvedValue({ addons: [] })
    mockGetProjectSettings.mockResolvedValue({ is_sensitive: false })
    mockSubscriptionHasHipaaAddon.mockReturnValue(false)
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

    it('should return AI opt-in level and limited status', async () => {
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
        isLimited: true,
        isHipaaEnabled: false,
      })
    })

    it('should mark pro plan as not limited', async () => {
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

      const result = await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer token',
        projectRef: 'test-project',
      })

      expect(result.isLimited).toBe(false)
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

      const result = await getOrgAIDetails({
        orgSlug: 'test-org',
        authorization: 'Bearer token',
        projectRef: 'test-project',
      })

      expect(result.isLimited).toBe(false) // Pro plan
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
