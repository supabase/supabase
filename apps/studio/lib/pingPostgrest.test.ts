import { describe, it, expect, vi, beforeEach } from 'vitest'
import pingPostgrest from './pingPostgrest'
import * as fetchModule from './common/fetch'

vi.mock('./constants', () => ({ API_URL: 'https://api.example.com' }))

describe('pingPostgrest', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true if headWithTimeout returns no error', async () => {
    vi.spyOn(fetchModule, 'headWithTimeout').mockResolvedValue({ error: undefined })
    const result = await pingPostgrest('my-project')
    expect(result).toBe(true)
  })

  it('returns false if headWithTimeout returns an error', async () => {
    vi.spyOn(fetchModule, 'headWithTimeout').mockResolvedValue({ error: { message: 'fail' } })
    const result = await pingPostgrest('my-project')
    expect(result).toBe(false)
  })

  it('returns false if projectRef is undefined', async () => {
    const result = await pingPostgrest(undefined as any)
    expect(result).toBe(false)
  })

  it('passes timeout option to headWithTimeout', async () => {
    const spy = vi.spyOn(fetchModule, 'headWithTimeout').mockResolvedValue({ error: undefined })
    await pingPostgrest('my-project', { timeout: 1234 })
    expect(spy).toHaveBeenCalledWith(
      'https://api.example.com/projects/my-project/api/rest',
      [],
      expect.objectContaining({ timeout: 1234 })
    )
  })
})
