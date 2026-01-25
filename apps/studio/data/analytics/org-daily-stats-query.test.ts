import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getOrgDailyStats } from './org-daily-stats-query'

vi.mock('data/fetchers', () => ({
  get: vi.fn(),
  handleError: vi.fn((error) => {
    throw error
  }),
}))

describe('org-daily-stats-query', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrgDailyStats', () => {
    it('throws error when orgSlug is not provided', async () => {
      await expect(
        getOrgDailyStats({
          orgSlug: undefined,
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
      ).rejects.toThrow('Org slug is required')
    })

    it('throws error when startDate is not provided', async () => {
      await expect(
        getOrgDailyStats({
          orgSlug: 'test-org',
          startDate: undefined,
          endDate: '2025-01-31',
        })
      ).rejects.toThrow('Start date is required')
    })

    it('throws error when endDate is not provided', async () => {
      await expect(
        getOrgDailyStats({
          orgSlug: 'test-org',
          startDate: '2025-01-01',
          endDate: undefined,
        })
      ).rejects.toThrow('Start date is required')
    })

    it('calls API with correct parameters including project_ref', async () => {
      const { get } = await import('data/fetchers')
      const mockGet = get as unknown as ReturnType<typeof vi.fn>

      const mockResponse = { usages: [] }
      mockGet.mockResolvedValueOnce({ data: mockResponse, error: null })

      const result = await getOrgDailyStats({
        orgSlug: 'test-org',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        projectRef: 'test-project-ref',
      })

      expect(mockGet).toHaveBeenCalledWith(
        '/platform/organizations/{slug}/usage/daily',
        expect.objectContaining({
          params: {
            path: { slug: 'test-org' },
            query: {
              start: '2025-01-01',
              end: '2025-01-31',
              project_ref: 'test-project-ref',
            },
          },
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('calls API without project_ref when not provided', async () => {
      const { get } = await import('data/fetchers')
      const mockGet = get as unknown as ReturnType<typeof vi.fn>

      const mockResponse = { usages: [] }
      mockGet.mockResolvedValueOnce({ data: mockResponse, error: null })

      await getOrgDailyStats({
        orgSlug: 'test-org',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      })

      expect(mockGet).toHaveBeenCalledWith(
        '/platform/organizations/{slug}/usage/daily',
        expect.objectContaining({
          params: {
            path: { slug: 'test-org' },
            query: {
              start: '2025-01-01',
              end: '2025-01-31',
              project_ref: undefined,
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
        getOrgDailyStats({
          orgSlug: 'test-org',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
      ).rejects.toThrow('API Error')
    })
  })
})
