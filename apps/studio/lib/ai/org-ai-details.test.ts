import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getOrgAIDetails } from './org-ai-details'
import { getOrganizations } from 'data/organizations/organizations-query'
import { getProjectDetail } from 'data/projects/project-detail-query'
import { getAiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'

vi.mock('data/organizations/organizations-query', () => ({
  getOrganizations: vi.fn(),
}))

vi.mock('data/projects/project-detail-query', () => ({
  getProjectDetail: vi.fn(),
}))

vi.mock('hooks/misc/useOrgOptedIntoAi', () => ({
  getAiOptInLevel: vi.fn(),
}))

describe('getOrgAIDetails', () => {
  const orgSlug = 'test-org'
  const authorization = 'Bearer token'
  const projectRef = 'test-project-ref'

  const mockOrg = {
    id: 1,
    slug: orgSlug,
    opt_in_tags: ['AI_SQL_GENERATOR_OPT_IN'],
    plan: { id: 'free' },
  }

  const mockProject = {
    ref: projectRef,
    organization_id: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAiOptInLevel as any).mockReturnValue('enabled')
  })

  it('should return AI details when project and org match', async () => {
    ;(getOrganizations as any).mockResolvedValue([mockOrg])
    ;(getProjectDetail as any).mockResolvedValue(mockProject)
    ;(getAiOptInLevel as any).mockReturnValue('enabled')

    const result = await getOrgAIDetails({ orgSlug, authorization, projectRef })

    expect(getOrganizations).toHaveBeenCalledWith({
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
    })
    expect(getProjectDetail).toHaveBeenCalledWith({ ref: projectRef }, undefined, {
      'Content-Type': 'application/json',
      Authorization: authorization,
    })
    expect(result).toEqual({
      aiOptInLevel: 'enabled',
      isLimited: true,
    })
  })

  it('should throw error when project and org do not match', async () => {
    ;(getOrganizations as any).mockResolvedValue([mockOrg])
    ;(getProjectDetail as any).mockResolvedValue({
      ...mockProject,
      organization_id: 2,
    })

    await expect(getOrgAIDetails({ orgSlug, authorization, projectRef })).rejects.toThrow(
      'Project and organization do not match'
    )
  })

  it('should throw error when org is not found', async () => {
    ;(getOrganizations as any).mockResolvedValue([])
    ;(getProjectDetail as any).mockResolvedValue(mockProject)

    await expect(getOrgAIDetails({ orgSlug, authorization, projectRef })).rejects.toThrow(
      'Project and organization do not match'
    )
  })

  it('should include authorization header when provided', async () => {
    ;(getOrganizations as any).mockResolvedValue([mockOrg])
    ;(getProjectDetail as any).mockResolvedValue(mockProject)

    await getOrgAIDetails({ orgSlug, authorization, projectRef })

    expect(getOrganizations).toHaveBeenCalledWith({
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
    })
  })

  it('should not include authorization header when not provided', async () => {
    ;(getOrganizations as any).mockResolvedValue([mockOrg])
    ;(getProjectDetail as any).mockResolvedValue(mockProject)

    await getOrgAIDetails({ orgSlug, authorization: '', projectRef })

    expect(getOrganizations).toHaveBeenCalledWith({
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })

  it('should return isLimited true for free plan', async () => {
    ;(getOrganizations as any).mockResolvedValue([mockOrg])
    ;(getProjectDetail as any).mockResolvedValue(mockProject)

    const result = await getOrgAIDetails({ orgSlug, authorization, projectRef })

    expect(result.isLimited).toBe(true)
  })

  it('should return isLimited false for non-free plan', async () => {
    ;(getOrganizations as any).mockResolvedValue([{ ...mockOrg, plan: { id: 'pro' } }])
    ;(getProjectDetail as any).mockResolvedValue(mockProject)

    const result = await getOrgAIDetails({ orgSlug, authorization, projectRef })

    expect(result.isLimited).toBe(false)
  })
})
