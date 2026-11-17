// @vitest-environment jsdom
/// <reference types="vitest/jsdom" />
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getAccessToken } from './auth'

const { getSession, refreshSession } = vi.hoisted(() => ({
  getSession: vi.fn(),
  refreshSession: vi.fn(),
}))

vi.mock('./gotrue', () => ({
  gotrueClient: { getSession, refreshSession, onAuthStateChange: vi.fn() },
}))

const NOW = new Date('2026-01-01T00:00:00Z')

function sessionExpiringIn(seconds: number, token = 'current-token') {
  return {
    access_token: token,
    expires_at: Math.floor(NOW.getTime() / 1000) + seconds,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('getAccessToken', () => {
  it('returns the current token without a minimum validity', async () => {
    getSession.mockResolvedValue({ data: { session: sessionExpiringIn(60) }, error: null })

    await expect(getAccessToken()).resolves.toBe('current-token')
    expect(refreshSession).not.toHaveBeenCalled()
  })

  it('returns the current token when it stays valid long enough', async () => {
    getSession.mockResolvedValue({ data: { session: sessionExpiringIn(600) }, error: null })

    await expect(getAccessToken({ minValidityMs: 330_000 })).resolves.toBe('current-token')
    expect(refreshSession).not.toHaveBeenCalled()
  })

  it('refreshes a token that expires before the minimum validity', async () => {
    getSession.mockResolvedValue({ data: { session: sessionExpiringIn(120) }, error: null })
    refreshSession.mockResolvedValue({
      data: { session: sessionExpiringIn(3600, 'fresh-token') },
      error: null,
    })

    await expect(getAccessToken({ minValidityMs: 330_000 })).resolves.toBe('fresh-token')
    expect(refreshSession).toHaveBeenCalledTimes(1)
  })

  it('falls back to the current token when the refresh fails', async () => {
    getSession.mockResolvedValue({ data: { session: sessionExpiringIn(120) }, error: null })
    refreshSession.mockResolvedValue({
      data: { session: null },
      error: new Error('refresh failed'),
    })

    await expect(getAccessToken({ minValidityMs: 330_000 })).resolves.toBe('current-token')
  })

  it('returns undefined when signed out', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null })

    await expect(getAccessToken({ minValidityMs: 330_000 })).resolves.toBeUndefined()
    expect(refreshSession).not.toHaveBeenCalled()
  })
})
