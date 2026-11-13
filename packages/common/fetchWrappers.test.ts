import { beforeEach, describe, expect, it, vi } from 'vitest'

import { post } from './fetchWrappers'

const { getAccessToken } = vi.hoisted(() => ({ getAccessToken: vi.fn() }))

vi.mock('./auth', () => ({ getAccessToken }))

const fetchMock = vi.fn(() => Promise.resolve(new Response('{}')))

beforeEach(() => {
  fetchMock.mockClear()
  getAccessToken.mockReset()
  getAccessToken.mockResolvedValue('token-123')
  vi.stubGlobal('fetch', fetchMock)
})

const sentInit = () => (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
const sentHeaders = () => sentInit().headers as Headers

describe('post', () => {
  it('sends the access token', async () => {
    await post('https://api.example.com/x', { a: 1 })

    expect(sentHeaders().get('Authorization')).toBe('Bearer token-123')
  })

  it('issues the request in the same tick when told to skip the access token', () => {
    // Not awaited: the page may unload before a later tick
    void post('https://api.example.com/x', { a: 1 }, { skipAccessToken: true, keepalive: true })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(getAccessToken).not.toHaveBeenCalled()
    expect(sentHeaders().get('Authorization')).toBeNull()
  })

  it('does not pass the option on to fetch', () => {
    void post('https://api.example.com/x', { a: 1 }, { skipAccessToken: true, keepalive: true })

    expect(sentInit()).toMatchObject({ keepalive: true, method: 'POST' })
    expect(sentInit()).not.toHaveProperty('skipAccessToken')
  })
})
