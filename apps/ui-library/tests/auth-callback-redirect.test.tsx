// @vitest-environment node
import { type NextRequest } from 'next/server'
import { type LoaderFunctionArgs } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/registry/default/blocks/password-based-auth-nextjs/app/auth/confirm/route'
import { loader } from '@/registry/default/blocks/password-based-auth-react-router/app/routes/auth.confirm'
import { safeNextPath } from '@/registry/default/blocks/safe-next-path/lib/safe-next-path'
import { loader as oauthLoader } from '@/registry/default/blocks/social-auth-react-router/app/routes/auth.oauth'

const { verifyOtp, exchangeCodeForSession } = vi.hoisted(() => ({
  verifyOtp: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw { redirectTo: url }
  },
}))
vi.mock('@/registry/default/clients/nextjs/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { verifyOtp } }),
}))
vi.mock('@/registry/default/clients/react-router/lib/supabase/server', () => ({
  createClient: () => ({
    supabase: { auth: { verifyOtp, exchangeCodeForSession } },
    headers: new Headers(),
  }),
}))

const origin = 'https://app.example.com'

const confirmUrl = (next: string | null) => {
  const params = new URLSearchParams({ token_hash: 'test-hash', type: 'email' })
  if (next !== null) params.set('next', next)
  return `${origin}/auth/confirm?${params}`
}

const runners = {
  'Next.js': async (url: string) => {
    try {
      await GET(new Request(url) as NextRequest)
    } catch (thrown) {
      if (typeof thrown === 'object' && thrown !== null && 'redirectTo' in thrown) {
        return thrown.redirectTo
      }
      throw thrown
    }
    throw new Error('Expected a redirect')
  },
  'React Router': async (url: string) => {
    const response = await loader({ request: new Request(url) } as LoaderFunctionArgs)
    return (response as Response).headers.get('Location')
  },
}

const destinations = [
  ['/protected', '/protected'],
  ['/agents?tab=connected&sort=name#tools', '/agents?tab=connected&sort=name#tools'],
  [null, '/'],
  ['', '/'],
  ['https://evil.example/agents', '/'],
  ['//evil.example/agents', '/'],
  ['/\\evil.example/agents', '/'],
  ['/\t/evil.example/agents', '/'],
  ['/.//evil.example/agents', '/'],
  ['/a/..//evil.example/agents', '/'],
  ['/%2e//evil.example/agents', '/'],
  ['/日本語', '/%E6%97%A5%E6%9C%AC%E8%AA%9E'],
] as const

describe.each(Object.entries(runners))('%s email confirm route', (_name, run) => {
  beforeEach(() => {
    vi.clearAllMocks()
    verifyOtp.mockResolvedValue({ error: null })
  })

  it.each(destinations)('sends next=%j to %j after verifying the token', async (next, expected) => {
    expect(await run(confirmUrl(next))).toBe(expected)
    expect(verifyOtp).toHaveBeenCalledWith({ type: 'email', token_hash: 'test-hash' })
  })

  it('shows the error page instead of following next when verification fails', async () => {
    verifyOtp.mockResolvedValue({ error: { message: 'Token has expired' } })
    expect(await run(confirmUrl('/agents'))).toBe('/auth/error?error=Token has expired')
  })

  it('shows the error page without calling Supabase when the token is missing', async () => {
    expect(await run(`${origin}/auth/confirm?next=/agents`)).toBe(
      '/auth/error?error=No token hash or type'
    )
    expect(verifyOtp).not.toHaveBeenCalled()
  })
})

const oauthUrl = (next: string | null) => {
  const params = new URLSearchParams({ code: 'test-code' })
  if (next !== null) params.set('next', next)
  return `${origin}/auth/oauth?${params}`
}

const runOauth = async (url: string) => {
  const response = await oauthLoader({ request: new Request(url) } as LoaderFunctionArgs)
  return (response as Response).headers.get('Location')
}

describe('React Router OAuth callback route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    exchangeCodeForSession.mockResolvedValue({ error: null })
  })

  it.each(destinations)('sends next=%j to %j after exchanging the code', async (next, expected) => {
    expect(await runOauth(oauthUrl(next))).toBe(expected)
    expect(exchangeCodeForSession).toHaveBeenCalledWith('test-code')
  })

  it('shows the error page instead of following next when the exchange fails', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: 'Invalid code' } })
    expect(await runOauth(oauthUrl('/agents'))).toBe('/auth/error?error=Invalid code')
  })

  it('shows the error page without calling Supabase when the code is missing', async () => {
    expect(await runOauth(`${origin}/auth/oauth?next=/agents`)).toBe('/auth/error')
    expect(exchangeCodeForSession).not.toHaveBeenCalled()
  })
})

describe('safeNextPath', () => {
  it.each([
    ['/agents?tab=1#top', '/agents?tab=1#top'],
    ['/./agents', '/agents'],
    ['/a/../agents', '/agents'],
    ['/.//evil.example', '/'],
    ['/..//evil.example', '/'],
    ['/./\\evil.example', '/'],
  ])('maps %j to %j', (input, expected) => {
    expect(safeNextPath(input, '/', origin)).toBe(expected)
  })
})
