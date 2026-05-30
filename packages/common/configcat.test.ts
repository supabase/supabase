import * as configcat from 'configcat-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('configcat-js', () => ({
  getClient: vi.fn(),
  PollingMode: {
    AutoPoll: 'AutoPoll',
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
})
