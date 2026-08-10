import * as configcat from 'configcat-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('configcat-js', () => ({
  getClient: vi.fn(),
  PollingMode: {
    AutoPoll: 'AutoPoll',
    LazyLoad: 'LazyLoad',
  },
  ClientCacheState: {
    NoFlagData: 0,
    HasLocalOverrideFlagDataOnly: 1,
    HasCachedFlagDataOnly: 2,
    HasUpToDateFlagData: 3,
  },
  User: vi.fn(),
}))

describe('configcat', () => {
  const mockClient = {
    getAllValuesAsync: vi.fn(),
    waitForReady: vi.fn().mockResolvedValue(3), // HasUpToDateFlagData
    dispose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.unstubAllEnvs()
    ;(configcat.getClient as any).mockReturnValue(mockClient)
  })

  it('should return empty array when no email is provided', async () => {
    const { getFlags } = await import('./configcat')
    const result = await getFlags()
    expect(result).toEqual([])
  })

  it('should call getAllValuesAsync with user when email is provided', async () => {
    vi.stubEnv('NEXT_PUBLIC_CONFIGCAT_PROXY_URL', 'https://proxy.example.com')

    const { getFlags } = await import('./configcat')

    const email = 'test@example.com'
    const mockValues = { flag1: true, flag2: false }
    mockClient.getAllValuesAsync.mockResolvedValue(mockValues)

    const result = await getFlags(email)

    expect(configcat.User).toHaveBeenCalledWith(email, undefined, undefined, expect.any(Object))
    expect(mockClient.getAllValuesAsync).toHaveBeenCalled()
    expect(result).toEqual(mockValues)
  })

  it('should fall back to SDK key client when proxy returns NoFlagData', async () => {
    vi.stubEnv('NEXT_PUBLIC_CONFIGCAT_PROXY_URL', 'https://proxy.example.com')
    vi.stubEnv('NEXT_PUBLIC_CONFIGCAT_SDK_KEY', 'test-sdk-key')

    const proxyClient = {
      getAllValuesAsync: vi.fn(),
      waitForReady: vi.fn().mockResolvedValue(0), // NoFlagData
      dispose: vi.fn(),
    }
    const sdkClient = {
      getAllValuesAsync: vi.fn().mockResolvedValue([]),
      waitForReady: vi.fn().mockResolvedValue(3), // HasUpToDateFlagData
      dispose: vi.fn(),
    }

    ;(configcat.getClient as any).mockReturnValueOnce(proxyClient).mockReturnValueOnce(sdkClient)

    const { getFlags } = await import('./configcat')
    await getFlags()

    expect(configcat.getClient).toHaveBeenCalledTimes(2)
    expect(proxyClient.dispose).toHaveBeenCalled()
    expect(configcat.getClient).toHaveBeenNthCalledWith(2, 'test-sdk-key', 'AutoPoll', {
      pollIntervalSeconds: 7 * 60,
    })
  })

  describe('getServerFlags', () => {
    it('should return empty array and skip getClient when no SDK key is present', async () => {
      const { getServerFlags } = await import('./configcat')
      const result = await getServerFlags('test@example.com')

      expect(result).toEqual([])
      expect(configcat.getClient).not.toHaveBeenCalled()
    })

    it('should prefer the proxy over the direct SDK key when both are configured', async () => {
      vi.stubEnv('NEXT_PUBLIC_CONFIGCAT_SDK_KEY', 'test-sdk-key')
      vi.stubEnv('NEXT_PUBLIC_CONFIGCAT_PROXY_URL', 'https://proxy.example.com')
      mockClient.getAllValuesAsync.mockResolvedValue([])

      const { getServerFlags } = await import('./configcat')
      await getServerFlags('test@example.com')

      expect(configcat.getClient).toHaveBeenCalledTimes(1)
      expect(configcat.getClient).toHaveBeenCalledWith('configcat-proxy/server-v1', 'LazyLoad', {
        baseUrl: 'https://proxy.example.com',
      })
      expect(mockClient.waitForReady).not.toHaveBeenCalled()
    })

    it('should fall back to the direct SDK key when no proxy URL is configured', async () => {
      vi.stubEnv('NEXT_PUBLIC_CONFIGCAT_SDK_KEY', 'test-sdk-key')
      mockClient.getAllValuesAsync.mockResolvedValue([])

      const { getServerFlags } = await import('./configcat')
      await getServerFlags('test@example.com')

      expect(configcat.getClient).toHaveBeenCalledWith('test-sdk-key', 'LazyLoad')
    })

    it('should call getAllValuesAsync with a user built from the given email', async () => {
      vi.stubEnv('NEXT_PUBLIC_CONFIGCAT_SDK_KEY', 'test-sdk-key')
      const mockValues = [{ settingKey: 'explorer', settingValue: true }]
      mockClient.getAllValuesAsync.mockResolvedValue(mockValues)

      const { getServerFlags } = await import('./configcat')
      const result = await getServerFlags('test@example.com')

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

      const { getServerFlags } = await import('./configcat')
      await getServerFlags('a@example.com')
      await getServerFlags('b@example.com')

      expect(configcat.getClient).toHaveBeenCalledTimes(1)
    })
  })
})
