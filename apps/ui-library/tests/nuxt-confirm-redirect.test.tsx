// @vitest-environment node
import { createServer } from 'node:http'
import { createApp, toNodeListener, type EventHandler } from 'h3'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { verifyOtp } = vi.hoisted(() => ({ verifyOtp: vi.fn() }))

vi.mock('@/registry/default/clients/nuxtjs/server/supabase/client', () => ({
  createSupabaseServerClient: () => ({ auth: { verifyOtp } }),
}))

const { default: confirm } = await vi.importActual<{ default: EventHandler }>(
  '../../../blocks/vue/registry/default/password-based-auth/nuxtjs/server/routes/auth/confirm.get'
)

const app = createApp().use('/auth/confirm', confirm)
const server = createServer(toNodeListener(app))
let origin: string

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error('Expected a TCP server address')
  }
  origin = `http://127.0.0.1:${address.port}`
})

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
})

beforeEach(() => {
  vi.clearAllMocks()
  verifyOtp.mockResolvedValue({ error: null })
})

describe('Nuxt confirmation redirect', () => {
  it.each([
    [['//evil.example/agents'], '/'],
    [['/\\evil.example/agents'], '/'],
    [['/agents', '/other'], '/'],
    [['/agents?tab=connected&sort=name#tools'], '/agents?tab=connected&sort=name#tools'],
    [['/日本語'], '/%E6%97%A5%E6%9C%AC%E8%AA%9E'],
  ] as const)('redirects next=%j to %s', async (next, expected) => {
    const url = new URL('/auth/confirm', origin)
    url.searchParams.set('token_hash', 'test-hash')
    url.searchParams.set('type', 'email')
    for (const value of next) {
      url.searchParams.append('next', value)
    }

    const response = await fetch(url, { redirect: 'manual' })

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe(expected)
    expect(verifyOtp).toHaveBeenCalledExactlyOnceWith({ token_hash: 'test-hash', type: 'email' })
  })
})
