import * as configcat from 'configcat-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getFlags } from './configcat'

vi.mock('data/fetchers', () => ({
  fetchHandler: vi.fn(),
}))

vi.mock('configcat-js', () => ({
  getClient: vi.fn(),
  PollingMode: {
    AutoPoll: 'AutoPoll',
  },
  User: vi.fn(),
}))

describe('configcat', () => {
  const mockClient = {
    getAllValuesAsync: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(configcat.getClient as any).mockReturnValue(mockClient)
  })

  it('should return empty array when no email is provided', async () => {
    const result = await getFlags()
    expect(result).toEqual([])
  })

  it('should call getAllValuesAsync with user when email is provided', async () => {
    const email = 'test@example.com'
    const mockValues = { flag1: true, flag2: false }
    mockClient.getAllValuesAsync.mockResolvedValue(mockValues)

    const { fetchHandler } = await import('./configcat')
    const mockFetchHandler = fetchHandler as unknown as ReturnType<typeof vi.fn>
    mockFetchHandler.mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
      })
    )

    const result = await getFlags(email)

    expect(configcat.User).toHaveBeenCalledWith(email)
    expect(mockClient.getAllValuesAsync).toHaveBeenCalled()
    expect(result).toEqual(mockValues)
  })
})
