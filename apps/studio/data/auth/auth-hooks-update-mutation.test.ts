import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/data/fetchers', () => ({
  patch: vi.fn(),
  handleError: vi.fn((error) => {
    throw error
  }),
}))

describe('auth-hooks-update-mutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('updateAuthHooks', () => {
    it('routes hook updates through /platform/auth/{ref}/config to avoid wiping SMTP settings', async () => {
      const { patch } = await import('@/data/fetchers')
      const { updateAuthHooks } = await import('./auth-hooks-update-mutation')

      const mockPatch = patch as unknown as ReturnType<typeof vi.fn>
      mockPatch.mockResolvedValueOnce({
        data: { HOOK_SEND_EMAIL_ENABLED: true },
        error: null,
      })

      const hookPayload = {
        HOOK_SEND_EMAIL_ENABLED: true,
        HOOK_SEND_EMAIL_URI: 'https://example.com/send-email',
        HOOK_SEND_EMAIL_SECRETS: null,
      }

      await updateAuthHooks({
        projectRef: 'test-project-ref',
        config: hookPayload,
      })

      // Verifies the endpoint is the general /config endpoint (partial merge) and NOT /config/hooks
      expect(mockPatch).toHaveBeenCalledTimes(1)
      expect(mockPatch).toHaveBeenCalledWith('/platform/auth/{ref}/config', {
        params: { path: { ref: 'test-project-ref' } },
        body: hookPayload,
      })
      expect(mockPatch).not.toHaveBeenCalledWith('/platform/auth/{ref}/config/hooks', expect.anything())
    })
  })
})
