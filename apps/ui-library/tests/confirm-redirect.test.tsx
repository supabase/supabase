import { type NextRequest } from 'next/server'
import { type LoaderFunctionArgs } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/registry/default/blocks/password-based-auth-nextjs/app/auth/confirm/route'
import { loader } from '@/registry/default/blocks/password-based-auth-react-router/app/routes/auth.confirm'
import { safeNextPath } from '@/registry/default/blocks/safe-next-path/lib/safe-next-path'

const { verifyOtp } = vi.hoisted(() => ({ verifyOtp: vi.fn() }))

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw { redirectTo: url }
  },
}))
vi.mock('@/registry/default/clients/nextjs/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { verifyOtp } }),
}))
vi.mock('@/registry/default/clients/react-router/lib/supabase/server', () => ({
  createClient: () => ({ supabase: { auth: { verifyOtp } }, headers: new Headers() }),
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
      return (thrown as { redirectTo: string }).redirectTo
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
  ['/.//evil.example/agents', '/'],
  ['/a/..//evil.example/agents', '/'],
  ['/%2e//evil.example/agents', '/'],
] as const

describe.each(Object.entries(runners))('%s email confirm route', (_name, run) => {
  beforeEach(() => {
    vi.clearAllMocks()
    verifyOtp.mockResolvedValue({ error: null })
  })

  it.each(destinations)('sends next=%s to %s after verifying the token', async (next, expected) => {
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

describe('safeNextPath', () => {
  it.each([
    ['/agents?tab=1#top', '/agents?tab=1#top'],
    ['/./agents', '/agents'],
    ['/a/../agents', '/agents'],
    ['/.//evil.example', '/'],
    ['/..//evil.example', '/'],
    ['/./\\evil.example', '/'],
  ])('maps %s to %s', (input, expected) => {
    expect(safeNextPath(input, '/', origin)).toBe(expected)
  })
})
