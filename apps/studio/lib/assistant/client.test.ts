import type { Session } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  platform: vi.fn(),
  session: vi.fn(),
  set: vi.fn(),
  signOut: vi.fn(),
  subscribe: vi.fn(),
}))
vi.mock('common', () => ({
  gotrueClient: { getSession: mocks.platform, onAuthStateChange: mocks.subscribe },
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getSession: mocks.session, setSession: mocks.set, signOut: mocks.signOut },
  }),
}))
let subject = 'platform-a'
function cached(id: string): Partial<Session> {
  return {
    access_token: 'cached-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: 'assistant',
      aud: 'authenticated',
      created_at: '2026-01-01',
      app_metadata: { platform_user_id: id },
      user_metadata: {},
    },
  }
}
beforeEach(() => {
  vi.resetModules()
  vi.resetAllMocks()
  subject = 'platform-a'
  vi.stubEnv('NEXT_PUBLIC_ASSISTANT_SUPABASE_URL', 'https://assistant.example')
  vi.stubEnv('NEXT_PUBLIC_ASSISTANT_PUBLISHABLE_KEY', 'publishable')
  vi.stubEnv('NEXT_PUBLIC_ASSISTANT_API_URL', 'https://assistant.example')
  mocks.platform.mockImplementation(async () => ({
    data: { session: subject ? { access_token: 'platform-token', user: { id: subject } } : null },
  }))
  mocks.session.mockResolvedValue({ data: { session: null } })
  mocks.signOut.mockResolvedValue({})
  mocks.set.mockImplementation(async () => ({
    data: { user: { app_metadata: { platform_user_id: subject } } },
  }))
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ access_token: 'exchanged', refresh_token: 'refresh' }))
  )
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})
describe('assistant account binding', () => {
  it('shares concurrent exchanges and sends only Assistant authorization to its API', async () => {
    const { getAssistantRequestHeaders } = await import('./client')
    const results = await Promise.all(Array.from({ length: 5 }, () => getAssistantRequestHeaders()))
    expect(fetch).toHaveBeenCalledOnce()
    expect(mocks.set).toHaveBeenCalledOnce()
    expect(results[0]).toEqual({
      Authorization: 'Bearer exchanged',
    })
    expect(fetch).toHaveBeenCalledWith(
      'https://assistant.example/auth/exchange',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer platform-token' }),
      })
    )
  })
  it('uses only a cache belonging to the active platform account', async () => {
    const { getAssistantRequestHeaders } = await import('./client')
    mocks.session.mockResolvedValueOnce({ data: { session: cached(subject) } })
    expect((await getAssistantRequestHeaders()).Authorization).toBe('Bearer cached-token')
    expect(fetch).not.toHaveBeenCalled()
    mocks.session.mockResolvedValueOnce({ data: { session: cached('other-account') } })
    expect((await getAssistantRequestHeaders()).Authorization).toBe('Bearer exchanged')
    expect(mocks.signOut).toHaveBeenCalled()
  })
  it('does not exchange after sign-out, even with a cached assistant session', async () => {
    const { getAssistantRequestHeaders } = await import('./client')
    subject = ''
    mocks.session.mockResolvedValue({ data: { session: cached('platform-a') } })
    await expect(getAssistantRequestHeaders()).rejects.toThrow('Not signed in')
    expect(fetch).not.toHaveBeenCalled()
  })
  it('does not install a session if the account changed during exchange', async () => {
    const { getAssistantRequestHeaders } = await import('./client')
    vi.mocked(fetch).mockImplementation(async () => {
      subject = 'platform-b'
      return Response.json({ access_token: 'old-token', refresh_token: 'refresh' })
    })
    await expect(getAssistantRequestHeaders()).rejects.toThrow('account changed')
    expect(mocks.set).not.toHaveBeenCalled()
  })
})
