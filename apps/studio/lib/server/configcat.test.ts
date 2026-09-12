import * as configcat from '@configcat/sdk/node'
import type { IConfigCatClient } from '@configcat/sdk/node'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@configcat/sdk/node', () => ({
  getClient: vi.fn(),
  PollingMode: {
    LazyLoad: 'LazyLoad',
  },
  User: vi.fn(),
}))

describe('lib/server/configcat getServerFlags', () => {
  const mockClient = {
    getAllValuesAsync: vi.fn(),
  }

  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.mocked(configcat.getClient).mockReturnValue(mockClient as unknown as IConfigCatClient)
  })

  it('should return empty array and skip getClient when no env vars are present', async () => {
    const { getServerFlags, trustedUserEmail } = await import('./configcat')
    const result = await getServerFlags(trustedUserEmail('test@example.com'))

    expect(result).toEqual([])
    expect(configcat.getClient).not.toHaveBeenCalled()
  })

  it('should prefer the proxy over the direct SDK key when both are configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_CONFIGCAT_SDK_KEY', 'test-sdk-key')
    vi.stubEnv('NEXT_PUBLIC_CONFIGCAT_PROXY_URL', 'https://proxy.example.com')
    mockClient.getAllValuesAsync.mockResolvedValue([])

    const { getServerFlags, trustedUserEmail } = await import('./configcat')
    await getServerFlags(trustedUserEmail('test@example.com'))

    expect(configcat.getClient).toHaveBeenCalledTimes(1)
    expect(configcat.getClient).toHaveBeenCalledWith('configcat-proxy/frontend-v2', 'LazyLoad', {
      baseUrl: 'https://proxy.example.com',
    })
  })

  it('should fall back to the direct SDK key when no proxy URL is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_CONFIGCAT_SDK_KEY', 'test-sdk-key')
    mockClient.getAllValuesAsync.mockResolvedValue([])

    const { getServerFlags, trustedUserEmail } = await import('./configcat')
    await getServerFlags(trustedUserEmail('test@example.com'))

    expect(configcat.getClient).toHaveBeenCalledWith('test-sdk-key', 'LazyLoad')
  })

  it('should call getAllValuesAsync with a user built from the given email', async () => {
    vi.stubEnv('NEXT_PUBLIC_CONFIGCAT_SDK_KEY', 'test-sdk-key')
    const mockValues = [{ settingKey: 'explorer', settingValue: true }]
    mockClient.getAllValuesAsync.mockResolvedValue(mockValues)

    const { getServerFlags, trustedUserEmail } = await import('./configcat')
    const result = await getServerFlags(trustedUserEmail('test@example.com'))

    expect(configcat.User).toHaveBeenCalledWith(
      'test@example.com',
      undefined,
      undefined,
      expect.any(Object)
    )
    expect(result).toEqual(mockValues)
  })

  it('reuses the same client across calls instead of creating a new one each time', async () => {
    vi.stubEnv('NEXT_PUBLIC_CONFIGCAT_SDK_KEY', 'test-sdk-key')
    mockClient.getAllValuesAsync.mockResolvedValue([])

    const { getServerFlags, trustedUserEmail } = await import('./configcat')
    await getServerFlags(trustedUserEmail('a@example.com'))
    await getServerFlags(trustedUserEmail('b@example.com'))

    expect(configcat.getClient).toHaveBeenCalledTimes(1)
  })

  describe('is_staff targeting attribute', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_CONFIGCAT_SDK_KEY', 'test-sdk-key')
      mockClient.getAllValuesAsync.mockResolvedValue([])
    })

    it('is true for a real @supabase.com/@supabase.io email', async () => {
      const { getServerFlags, trustedUserEmail } = await import('./configcat')
      await getServerFlags(trustedUserEmail('person@supabase.io'))

      expect(configcat.User).toHaveBeenCalledWith(
        'person@supabase.io',
        undefined,
        undefined,
        expect.objectContaining({ is_staff: 'true' })
      )
    })

    it('is false for a domain that merely contains "@supabase." as a substring', async () => {
      const { getServerFlags, trustedUserEmail } = await import('./configcat')
      await getServerFlags(trustedUserEmail('attacker@supabase.evil.com'))

      expect(configcat.User).toHaveBeenCalledWith(
        'attacker@supabase.evil.com',
        undefined,
        undefined,
        expect.objectContaining({ is_staff: 'false' })
      )
    })

    it('is false when no email is given', async () => {
      const { getServerFlags } = await import('./configcat')
      await getServerFlags(undefined)

      expect(configcat.User).toHaveBeenCalledWith(
        'anonymous',
        undefined,
        undefined,
        expect.objectContaining({ is_staff: 'false' })
      )
    })
  })
})
