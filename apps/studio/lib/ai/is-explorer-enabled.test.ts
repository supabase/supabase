import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isExplorerEnabled } from './is-explorer-enabled'
import { trustedUserEmail, type getServerFlags as GetServerFlags } from '@/lib/server/configcat'

type Flags = Awaited<ReturnType<typeof GetServerFlags>>

const TEST_EMAIL = trustedUserEmail('user@example.com')

vi.mock('common', () => ({ IS_PLATFORM: true }))
vi.mock('@/lib/server/configcat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/server/configcat')>()
  return { ...actual, getServerFlags: vi.fn() }
})

describe('isExplorerEnabled', () => {
  beforeEach(async () => {
    const common = await import('common')
    vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(true)
  })

  it('returns false when self-hosted, without calling getServerFlags', async () => {
    const common = await import('common')
    vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(false)

    const { getServerFlags } = await import('@/lib/server/configcat')
    const result = await isExplorerEnabled(TEST_EMAIL)

    expect(result).toBe(false)
    expect(getServerFlags).not.toHaveBeenCalled()
  })

  it('returns true when the explorer flag resolves true for this user', async () => {
    const { getServerFlags } = await import('@/lib/server/configcat')
    vi.mocked(getServerFlags).mockResolvedValue([
      { settingKey: 'explorer', settingValue: true },
      { settingKey: 'other_flag', settingValue: false },
    ] satisfies Flags)

    const result = await isExplorerEnabled(TEST_EMAIL)

    expect(result).toBe(true)
    expect(getServerFlags).toHaveBeenCalledWith(TEST_EMAIL)
  })

  it('returns false when the explorer flag is absent or false', async () => {
    const { getServerFlags } = await import('@/lib/server/configcat')
    vi.mocked(getServerFlags).mockResolvedValue([
      { settingKey: 'explorer', settingValue: false },
    ] satisfies Flags)

    const result = await isExplorerEnabled(TEST_EMAIL)

    expect(result).toBe(false)
  })
})
