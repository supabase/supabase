import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import type { app as App } from './app'

// Exercise the installed authentication middleware, with only its remote dependencies replaced.
vi.mock('./routes', () => ({
  routes: [
    {
      method: 'GET',
      pattern: '/protected',
      auth: 'user',
      handler: () => Response.json({ ok: true }),
    },
  ],
}))
const userId = '11111111-1111-4111-8111-111111111111'
const platformId = '22222222-2222-4222-8222-222222222222'
let app: typeof App
let key: CryptoKey
let admitted = true
let mappedId = platformId
let network = vi.fn()

beforeAll(async () => {
  const keys = await generateKeyPair('ES256')
  key = keys.privateKey
  vi.stubEnv('ASSISTANT_SUPABASE_URL', 'https://assistant.example')
  vi.stubEnv('ASSISTANT_PUBLISHABLE_KEY', 'sb_publishable_test')
  vi.stubEnv('ASSISTANT_SECRET_KEY', 'sb_secret_test')
  vi.stubEnv('ASSISTANT_POLICY_URL', 'https://studio.example/policy')
  vi.stubEnv(
    'ASSISTANT_JWKS',
    JSON.stringify({ keys: [{ ...(await exportJWK(keys.publicKey)), kid: 'test', alg: 'ES256' }] })
  )
  network = vi.fn(async (input: string | URL | Request) => {
    const url = String(input instanceof Request ? input.url : input)
    if (url.startsWith('https://studio.example/policy'))
      return Response.json(
        { userId: platformId, canShareProjectData: false, hasAccessToAdvanceModel: false },
        { status: admitted ? 200 : 403 }
      )
    if (url.includes('/rest/v1/platform_identities'))
      return Response.json({ platform_user_id: mappedId })
    throw new Error(`Unexpected network request: ${url}`)
  })
  vi.stubGlobal('fetch', network)
  ;({ app } = await import('./app'))
})
afterAll(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})
async function token(options: { expiry?: number; role?: string; aud?: string } = {}) {
  return new SignJWT({ role: options.role ?? 'authenticated' })
    .setProtectedHeader({ alg: 'ES256', kid: 'test' })
    .setSubject(userId)
    .setAudience(options.aud ?? 'authenticated')
    .setIssuedAt()
    .setExpirationTime(options.expiry ?? '5m')
    .sign(key)
}
function request(jwt?: string, platform = true) {
  return app.request('https://assistant.example/protected', {
    headers: {
      ...(jwt ? { authorization: `Bearer ${jwt}` } : {}),
      ...(platform ? { 'x-platform-authorization': 'Bearer platform' } : {}),
    },
  })
}
describe('real Supabase auth middleware and rollout admission', () => {
  it('accepts a signed user JWT only when its platform identity is admitted', async () => {
    expect((await request(await token())).status).toBe(200)
  })
  it('rejects absent, malformed, and expired tokens before policy or database calls', async () => {
    for (const jwt of [undefined, 'malformed', await token({ expiry: 1 })]) {
      network.mockClear()
      expect((await request(jwt)).status).toBe(401)
      expect(network).not.toHaveBeenCalled()
    }
  })
  it('requires both audience and authenticated role', async () => {
    expect((await request(await token({ aud: 'another' }))).status).toBe(401)
    expect((await request(await token({ role: 'service_role' }))).status).toBe(401)
  })
  it('rejects a missing or mismatched platform identity', async () => {
    expect((await request(await token(), false)).status).toBe(401)
    mappedId = userId
    expect((await request(await token())).status).toBe(403)
    mappedId = platformId
  })
  it('enforces the kill switch for direct worker requests', async () => {
    admitted = false
    expect((await request(await token())).status).toBe(403)
    admitted = true
  })
})
