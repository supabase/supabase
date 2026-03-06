import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getOrgUsage } from './org-usage-query'

vi.mock('data/fetchers', () => ({
  get: vi.fn(),
  handleError: vi.fn((error) => {
    throw error
  }),
}))

describe('org-usage-query', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrgUsage', () => {
    it('throws error when orgSlug is not provided', async () => {
      await expect(getOrgUsage({ orgSlug: undefined })).rejects.toThrow('orgSlug is required')
    })

    it('calls API with correct parameters including project_ref', async () => {
      const { get } = await import('data/fetchers')
      const mockGet = get as unknown as ReturnType<typeof vi.fn>

      const mockResponse = { usages: [] }
      mockGet.mockResolvedValueOnce({ data: mockResponse, error: null })

      const startDate = new Date('2025-01-01T00:00:00.000Z')
      const endDate = new Date('2025-01-31T23:59:59.000Z')

      const result = await getOrgUsage({
        orgSlug: 'test-org',
        projectRef: 'test-project-ref',
        start: startDate,
        end: endDate,
      })

      expect(mockGet).toHaveBeenCalledWith(
        '/platform/organizations/{slug}/usage',
        expect.objectContaining({
          params: {
            path: { slug: 'test-org' },
            query: {
              project_ref: 'test-project-ref',
              start: '2025-01-01T00:00:00.000Z',
              end: '2025-01-31T23:59:59.000Z',
            },
          },
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('calls API without project_ref when projectRef is null', async () => {
      const { get } = await import('data/fetchers')
      const mockGet = get as unknown as ReturnType<typeof vi.fn>

      const mockResponse = { usages: [] }
      mockGet.mockResolvedValueOnce({ data: mockResponse, error: null })

      await getOrgUsage({
        orgSlug: 'test-org',
        projectRef: null,
      })

      expect(mockGet).toHaveBeenCalledWith(
        '/platform/organizations/{slug}/usage',
        expect.objectContaining({
          params: {
            path: { slug: 'test-org' },
            query: {
              project_ref: undefined,
              start: undefined,
              end: undefined,
            },
          },
        })
      )
    })

    it('calls API without date params when start and end are undefined', async () => {
      const { get } = await import('data/fetchers')
      const mockGet = get as unknown as ReturnType<typeof vi.fn>

      const mockResponse = { usages: [] }
      mockGet.mockResolvedValueOnce({ data: mockResponse, error: null })

      await getOrgUsage({
        orgSlug: 'test-org',
      })

      expect(mockGet).toHaveBeenCalledWith(
        '/platform/organizations/{slug}/usage',
        expect.objectContaining({
          params: {
            path: { slug: 'test-org' },
            query: {
              project_ref: undefined,
              start: undefined,
              end: undefined,
            },
          },
        })
      )
    })

    it('handles API errors correctly', async () => {
      const { get, handleError } = await import('data/fetchers')
      const mockGet = get as unknown as ReturnType<typeof vi.fn>
      const mockHandleError = handleError as unknown as ReturnType<typeof vi.fn>

      const mockError = { message: 'API Error' }
      mockGet.mockResolvedValueOnce({ data: null, error: mockError })
      mockHandleError.mockImplementation((error) => {
        throw new Error(error.message)
      })

      await expect(
        getOrgUsage({
          orgSlug: 'test-org',
        })
      ).rejects.toThrow('API Error')
    })
  })
})
