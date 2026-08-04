import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/data/fetchers', () => ({
  post: vi.fn(),
  handleError: vi.fn((error) => {
    throw error
  }),
}))

describe('project-create-mutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createProject', () => {
    it('sends GitHub connection fields when provided', async () => {
      const { post } = await import('@/data/fetchers')
      const { createProject } = await import('./project-create-mutation')

      const mockPost = post as unknown as ReturnType<typeof vi.fn>
      mockPost.mockResolvedValueOnce({
        data: { ref: 'project-ref', organization_slug: 'test-org' },
        error: null,
      })

      await createProject({
        name: 'test-project',
        organizationSlug: 'test-org',
        dbPass: 'secret-password',
        dbRegion: 'West US (North California)',
        githubInstallationId: 1234,
        githubRepositoryId: 5678,
      })

      expect(mockPost).toHaveBeenCalledWith('/platform/projects', {
        body: expect.objectContaining({
          name: 'test-project',
          organization_slug: 'test-org',
          db_pass: 'secret-password',
          db_region: 'West US (North California)',
          github_installation_id: 1234,
          github_repository_id: 5678,
        }),
      })
    })

    it('does not populate GitHub connection fields when omitted', async () => {
      const { post } = await import('@/data/fetchers')
      const { createProject } = await import('./project-create-mutation')

      const mockPost = post as unknown as ReturnType<typeof vi.fn>
      mockPost.mockResolvedValueOnce({
        data: { ref: 'project-ref', organization_slug: 'test-org' },
        error: null,
      })

      await createProject({
        name: 'test-project',
        organizationSlug: 'test-org',
        dbPass: 'secret-password',
        dbRegion: 'West US (North California)',
      })

      expect(mockPost).toHaveBeenCalledWith('/platform/projects', {
        body: expect.objectContaining({
          github_installation_id: undefined,
          github_repository_id: undefined,
        }),
      })
    })
  })
})
