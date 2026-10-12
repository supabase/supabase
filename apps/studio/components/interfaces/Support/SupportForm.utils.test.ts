import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupportFormUrl, selectInitialOrgAndProject } from './SupportForm.utils'
import { createMockOrganization } from '@/tests/helpers'

vi.mock('@/data/projects/project-detail-query', () => ({
  getProjectDetail: vi.fn(),
}))

describe('createSupportFormUrl', () => {
  it('returns base URL with no params', () => {
    expect(createSupportFormUrl({})).toBe('/support/new')
  })

  it('does not append a bare ? when params are empty', () => {
    expect(createSupportFormUrl({})).not.toContain('?')
  })

  it('includes provided params in the query string', () => {
    const url = createSupportFormUrl({ projectRef: 'my-project' })
    expect(url).toContain('projectRef=my-project')
  })

  it('includes multiple params', () => {
    const url = createSupportFormUrl({ projectRef: 'my-project', subject: 'help' })
    expect(url).toContain('projectRef=my-project')
    expect(url).toContain('subject=help')
  })
})

describe('selectInitialOrgAndProject', () => {
  const orgA = createMockOrganization({ id: 1, slug: 'org-a' })
  const orgB = createMockOrganization({ id: 2, slug: 'org-b' })
  const orgs = [orgA, orgB]

  let mockGetProjectDetail: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    const projectDetailQuery = await import('@/data/projects/project-detail-query')
    mockGetProjectDetail = vi.mocked(projectDetailQuery.getProjectDetail)
    mockGetProjectDetail.mockReset()
  })

  it('resolves the org from the project when the Management API lookup succeeds', async () => {
    mockGetProjectDetail.mockResolvedValue({ organization_id: 2 })

    const result = await selectInitialOrgAndProject({
      projectRef: 'project-a',
      orgSlug: null,
      orgs,
    })

    expect(result).toEqual({ projectRef: 'project-a', orgSlug: 'org-b' })
  })

  it('prefers the org resolved from the project over a mismatched provided orgSlug', async () => {
    mockGetProjectDetail.mockResolvedValue({ organization_id: 2 })

    const result = await selectInitialOrgAndProject({
      projectRef: 'project-a',
      orgSlug: 'org-a',
      orgs,
    })

    expect(result).toEqual({ projectRef: 'project-a', orgSlug: 'org-b' })
  })

  it('keeps projectRef and falls back to the provided orgSlug when the Management API lookup throws', async () => {
    mockGetProjectDetail.mockRejectedValue(new Error('Management API is down'))

    const result = await selectInitialOrgAndProject({
      projectRef: 'project-a',
      orgSlug: 'org-b',
      orgs,
    })

    expect(result).toEqual({ projectRef: 'project-a', orgSlug: 'org-b' })
  })

  it('keeps projectRef and falls back to the provided orgSlug when the resolved org is not in the orgs list', async () => {
    mockGetProjectDetail.mockResolvedValue({ organization_id: 999 })

    const result = await selectInitialOrgAndProject({
      projectRef: 'project-a',
      orgSlug: 'org-b',
      orgs,
    })

    expect(result).toEqual({ projectRef: 'project-a', orgSlug: 'org-b' })
  })

  it('defaults to the first org and drops projectRef when neither the project nor orgSlug resolve', async () => {
    mockGetProjectDetail.mockRejectedValue(new Error('Management API is down'))

    const result = await selectInitialOrgAndProject({
      projectRef: 'project-a',
      orgSlug: 'unknown-org',
      orgs,
    })

    expect(result).toEqual({ projectRef: null, orgSlug: 'org-a' })
    expect(mockGetProjectDetail).toHaveBeenCalledWith({ ref: 'project-a' })
  })

  it('resolves via orgSlug without calling the Management API when no projectRef is provided', async () => {
    const result = await selectInitialOrgAndProject({
      projectRef: null,
      orgSlug: 'org-b',
      orgs,
    })

    expect(result).toEqual({ projectRef: null, orgSlug: 'org-b' })
    expect(mockGetProjectDetail).not.toHaveBeenCalled()
  })

  it('defaults to the first org when neither projectRef nor orgSlug are provided', async () => {
    const result = await selectInitialOrgAndProject({
      projectRef: null,
      orgSlug: null,
      orgs,
    })

    expect(result).toEqual({ projectRef: null, orgSlug: 'org-a' })
  })

  it('returns nulls when there are no orgs to fall back to', async () => {
    const result = await selectInitialOrgAndProject({
      projectRef: null,
      orgSlug: null,
      orgs: [],
    })

    expect(result).toEqual({ projectRef: null, orgSlug: null })
  })
})
