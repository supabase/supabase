import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { verifyPlatformIdentity } from './identity'

const userId = '11111111-1111-4111-8111-111111111111'
const network = vi.fn()

function token(claims: Record<string, unknown> = {}) {
  return [
    Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url'),
    Buffer.from(
      JSON.stringify({
        sub: userId,
        aud: 'authenticated',
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 300,
        aal: 'aal1',
        ...claims,
      })
    ).toString('base64url'),
    'signature-validated-by-auth-server',
  ].join('.')
}

beforeEach(() => {
  network.mockReset()
  network.mockResolvedValue(Response.json({ id: userId }))
  vi.stubGlobal('fetch', network)
  vi.stubEnv('PLATFORM_AUTH_URL', 'https://platform-auth.example/auth/v1')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('Studio session identity adapter', () => {
  it('authenticates the exact token with the configured Auth server before returning identity', async () => {
    const jwt = token({ iss: 'https://attacker.example', user_metadata: { id: 'attacker' } })
    await expect(verifyPlatformIdentity(jwt)).resolves.toEqual({ userId })
    expect(network).toHaveBeenCalledExactlyOnceWith(
      'https://platform-auth.example/auth/v1/user',
      expect.objectContaining({
        headers: { Authorization: `Bearer ${jwt}` },
        redirect: 'error',
        signal: expect.any(AbortSignal),
      })
    )
  })

  it('fails closed when the Auth server rejects an otherwise well-formed token', async () => {
    network.mockResolvedValue(Response.json({ id: userId }, { status: 401 }))
    await expect(verifyPlatformIdentity(token())).rejects.toMatchObject({ status: 401 })
  })

  it('does not accept a mismatched identity returned by the Auth server', async () => {
    network.mockResolvedValue(Response.json({ id: '22222222-2222-4222-8222-222222222222' }))
    await expect(verifyPlatformIdentity(token())).rejects.toMatchObject({ status: 401 })
  })

  it.each([
    { role: 'service_role' },
    { aud: 'another-app' },
    { exp: 1 },
    { exp: undefined },
    { sub: 'not-a-user-id' },
  ])('rejects an invalid user session: %j', async (claims) => {
    await expect(verifyPlatformIdentity(token(claims))).rejects.toMatchObject({ status: 401 })
  })

  it('rejects malformed tokens and malformed user responses', async () => {
    await expect(verifyPlatformIdentity('not-a-jwt')).rejects.toMatchObject({ status: 401 })
    network.mockResolvedValue(Response.json({ user_metadata: { id: userId } }))
    await expect(verifyPlatformIdentity(token())).rejects.toMatchObject({ status: 401 })
  })

  it('requires aal2 for a user with a verified MFA factor', async () => {
    network.mockImplementation(async () =>
      Response.json({ id: userId, factors: [{ status: 'verified' }] })
    )
    await expect(verifyPlatformIdentity(token())).rejects.toMatchObject({ status: 403 })
    await expect(verifyPlatformIdentity(token({ aal: 'aal2' }))).resolves.toEqual({ userId })
  })

  it('does not require MFA for a factor that has not been verified', async () => {
    network.mockResolvedValue(Response.json({ id: userId, factors: [{ status: 'unverified' }] }))
    await expect(verifyPlatformIdentity(token())).resolves.toEqual({ userId })
  })

  it('ignores user-editable identity and MFA metadata', async () => {
    network.mockResolvedValue(
      Response.json({
        id: userId,
        factors: [{ status: 'verified' }],
        user_metadata: { id: 'attacker', factors: [], aal: 'aal2' },
      })
    )
    await expect(verifyPlatformIdentity(token())).rejects.toMatchObject({ status: 403 })
  })

  it('rejects a malformed factors response instead of treating it as no enrolled MFA', async () => {
    network.mockResolvedValue(Response.json({ id: userId, factors: [{ status: 'unknown' }] }))
    await expect(verifyPlatformIdentity(token())).rejects.toMatchObject({ status: 401 })
  })

  it('propagates cancellation and refuses redirects instead of forwarding credentials', async () => {
    const controller = new AbortController()
    controller.abort()
    network.mockImplementation(async (_url: string, init: RequestInit) => {
      init.signal?.throwIfAborted()
      throw new TypeError('Redirect blocked')
    })
    await expect(verifyPlatformIdentity(token(), controller.signal)).rejects.toThrow()
    await expect(verifyPlatformIdentity(token())).rejects.toThrow('Redirect blocked')
    expect(network.mock.calls.every(([, init]) => init.redirect === 'error')).toBe(true)
  })
})
