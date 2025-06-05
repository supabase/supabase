import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fetchers from 'data/fetchers'
import * as common from 'common'
import * as constants from './constants'
import { trackFeatureFlag } from './posthog'

vi.mock('data/fetchers', () => ({
  post: vi.fn(),
  handleError: vi.fn(),
}))
vi.mock('common', () => ({
  hasConsented: vi.fn(),
  LOCAL_STORAGE_KEYS: {},
}))
vi.mock('./constants', () => ({
  IS_PLATFORM: true,
}))

describe('trackFeatureFlag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns undefined if user has not consented', async () => {
    vi.spyOn(common, 'hasConsented').mockReturnValue(false)
    const result = await trackFeatureFlag({ some: 'value' } as any)
    expect(result).toBeUndefined()
  })

  it('returns undefined if not on platform', async () => {
    vi.spyOn(common, 'hasConsented').mockReturnValue(true)
    vi.spyOn(constants, 'IS_PLATFORM', 'get').mockReturnValue(false)
    const result = await trackFeatureFlag({ some: 'value' } as any)
    expect(result).toBeUndefined()
  })

  it('calls post with correct body if consented and on platform', async () => {
    vi.spyOn(common, 'hasConsented').mockReturnValue(true)
    vi.spyOn(constants, 'IS_PLATFORM', 'get').mockReturnValue(true)
    vi.spyOn(fetchers, 'post').mockResolvedValue({ data: 'success' })

    const result = await trackFeatureFlag({ foo: 'bar' } as any)

    expect(fetchers.post).toHaveBeenCalledWith('/platform/telemetry/feature-flags/track', {
      body: { foo: 'bar' },
    })
    expect(result).toBe('success')
  })

  it('calls handleError if post returns error', async () => {
    vi.spyOn(common, 'hasConsented').mockReturnValue(true)
    vi.spyOn(constants, 'IS_PLATFORM', 'get').mockReturnValue(true)
    vi.spyOn(fetchers, 'post').mockResolvedValue({ error: { message: 'fail' } })

    await trackFeatureFlag({ foo: 'bar' } as any)

    expect(fetchers.handleError).toHaveBeenCalledWith({ message: 'fail' })
  })
})
