import { describe, expect, it, vi } from 'vitest'

describe('astro.config', () => {
  it('inlines only NEXT_PUBLIC_* vars, and only into the client build', async () => {
    vi.stubEnv('NEXT_PUBLIC_IS_PLATFORM', 'true')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'secret')
    const { default: config } = await import('./astro.config.mjs')

    expect(config.vite?.define).toBeUndefined()
    expect(config.vite?.environments?.ssr?.define).toBeUndefined()

    const inlined = JSON.parse(config.vite?.environments?.client?.define?.['process.env'])
    expect(inlined.NEXT_PUBLIC_IS_PLATFORM).toBe('true')
    expect(Object.keys(inlined).every((key) => key.startsWith('NEXT_PUBLIC_'))).toBe(true)
  }, 30_000)
})
