import * as fetchModule from 'data/fetchers'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import pingPostgrest from './pingPostgrest'

vi.mock('./constants', () => ({ API_URL: 'https://api.example.com' }))

describe('pingPostgrest', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true if fetchHeadWithTimeout returns no error', async () => {
    vi.spyOn(fetchModule, 'fetchHeadWithTimeout').mockResolvedValue({ error: undefined })
    const result = await pingPostgrest('my-project')
    expect(result).toBe(true)
  })

  it('returns false if fetchHeadWithTimeout returns an error', async () => {
    vi.spyOn(fetchModule, 'fetchHeadWithTimeout').mockResolvedValue({ error: { message: 'fail' } })
    const result = await pingPostgrest('my-project')
    expect(result).toBe(false)
  })

  it('returns false if projectRef is undefined', async () => {
    const result = await pingPostgrest(undefined as any)
    expect(result).toBe(false)
  })

  it('passes timeout option to fetchHeadWithTimeout', async () => {
    const spy = vi
      .spyOn(fetchModule, 'fetchHeadWithTimeout')
      .mockResolvedValue({ error: undefined })
    await pingPostgrest('my-project', { timeout: 1234 })
    expect(spy).toHaveBeenCalledWith(
      'https://api.example.com/projects/my-project/api/rest',
      [],
      expect.objectContaining({ timeout: 1234 })
    )
  })
})
