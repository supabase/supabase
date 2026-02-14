import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAccountRequest, confirmAccountRequest } from './stripe-product'

vi.mock('data/fetchers', () => ({
  constructHeaders: vi.fn().mockResolvedValue(new Headers()),
  fetchHandler: vi.fn(),
}))

vi.mock('lib/constants', () => ({
  API_URL: 'https://api.supabase.io/platform',
}))

describe('stripe product', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAccountRequest', () => {
    it('calls the correct URL and returns account request details', async () => {
      const { fetchHandler } = await import('data/fetchers')
      const mockFetch = fetchHandler as unknown as ReturnType<typeof vi.fn>

      const mockBody = {
        id: 'ar_123',
        email: 'test@example.com',
        name: 'Test User',
        status: 'pending',
        orchestrator: { type: 'stripe' },
        expires_at: '2026-12-31T00:00:00Z',
        email_matches: true,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBody),
      })

      const result = await getAccountRequest('ar_123')

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.supabase.io/partners/stripe/product/provisioning/account_requests/ar_123`,
        expect.objectContaining({ headers: expect.any(Headers) })
      )
      expect(result).toEqual(mockBody)
    })

    it('throws an error when the response is not ok', async () => {
      const { fetchHandler } = await import('data/fetchers')
      const mockFetch = fetchHandler as unknown as ReturnType<typeof vi.fn>

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      })

      await expect(getAccountRequest('ar_missing')).rejects.toThrow('Not found')
    })

    it('throws a default error message when no message in body', async () => {
      const { fetchHandler } = await import('data/fetchers')
      const mockFetch = fetchHandler as unknown as ReturnType<typeof vi.fn>

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      })

      await expect(getAccountRequest('ar_bad')).rejects.toThrow(
        'Failed to fetch account request: 500'
      )
    })

    it('encodes arId to prevent path injection', async () => {
      const { fetchHandler } = await import('data/fetchers')
      const mockFetch = fetchHandler as unknown as ReturnType<typeof vi.fn>

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '../evil' }),
      })

      await getAccountRequest('../evil')

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.supabase.io/partners/stripe/product/provisioning/account_requests/..%2Fevil`,
        expect.objectContaining({ headers: expect.any(Headers) })
      )
    })
  })

  describe('confirmAccountRequest', () => {
    it('calls the correct URL with POST and returns confirmation result', async () => {
      const { fetchHandler, constructHeaders } = await import('data/fetchers')
      const mockFetch = fetchHandler as unknown as ReturnType<typeof vi.fn>

      const mockHeaders = new Headers()
      ;(constructHeaders as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockHeaders)

      const mockBody = { success: true, organization_slug: 'my-org' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBody),
      })

      const result = await confirmAccountRequest('ar_123')

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.supabase.io/partners/stripe/product/provisioning/account_requests/ar_123/confirm`,
        expect.objectContaining({
          method: 'POST',
          headers: mockHeaders,
        })
      )
      expect(mockHeaders.get('Content-Type')).toBe('application/json')
      expect(result).toEqual(mockBody)
    })

    it('throws an error when the response is not ok', async () => {
      const { fetchHandler } = await import('data/fetchers')
      const mockFetch = fetchHandler as unknown as ReturnType<typeof vi.fn>

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Already confirmed' }),
      })

      await expect(confirmAccountRequest('ar_123')).rejects.toThrow('Already confirmed')
    })

    it('throws a default error message when no message in body', async () => {
      const { fetchHandler } = await import('data/fetchers')
      const mockFetch = fetchHandler as unknown as ReturnType<typeof vi.fn>

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      })

      await expect(confirmAccountRequest('ar_123')).rejects.toThrow(
        'Failed to confirm account request: 500'
      )
    })
  })
})
