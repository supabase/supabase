import type { getServerFlags as GetServerFlags } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isExplorerEnabled } from './is-explorer-enabled'

type Flags = Awaited<ReturnType<typeof GetServerFlags>>

vi.mock('common', () => ({ IS_PLATFORM: true, getServerFlags: vi.fn() }))

describe('isExplorerEnabled', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const common = await import('common')
    vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(true)
  })

  it('returns false when self-hosted, without calling getServerFlags', async () => {
    const common = await import('common')
    vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(false)

    const result = await isExplorerEnabled('user@example.com')

    expect(result).toBe(false)
    expect(common.getServerFlags).not.toHaveBeenCalled()
  })

  it('returns true when the explorer flag resolves true for this user', async () => {
    const common = await import('common')
    vi.mocked(common.getServerFlags).mockResolvedValue([
      { settingKey: 'explorer', settingValue: true },
      { settingKey: 'other_flag', settingValue: false },
    ] satisfies Flags)

    const result = await isExplorerEnabled('user@example.com')

    expect(result).toBe(true)
    expect(common.getServerFlags).toHaveBeenCalledWith('user@example.com')
  })

  it('returns false when the explorer flag is absent or false', async () => {
    const common = await import('common')
    vi.mocked(common.getServerFlags).mockResolvedValue([
      { settingKey: 'explorer', settingValue: false },
    ] satisfies Flags)

    const result = await isExplorerEnabled('user@example.com')

    expect(result).toBe(false)
  })
})
