import { createRequire } from 'node:module'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

const require = createRequire(import.meta.url)
const sdkRequire = createRequire(require.resolve('@vercel/config/v1'))
const { getTransformedRoutes } = sdkRequire('@vercel/routing-utils')
const compiledConfigSchema = z.object({
  error: z.unknown(),
  routes: z
    .array(z.object({ src: z.string().optional(), headers: z.record(z.string()).optional() }))
    .nullable(),
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe.each(['', '/dashboard'])('TanStack content types with base path "%s"', (basePath) => {
  let compiledRoutes: z.infer<typeof compiledConfigSchema>['routes']

  beforeEach(async () => {
    vi.resetModules()
    vi.stubEnv('STUDIO_FRAMEWORK', 'tanstack')
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', basePath)
    const { config } = await import('./vercel')
    const compiled: unknown = getTransformedRoutes({ headers: config.headers })
    const result = compiledConfigSchema.parse(compiled)
    expect(result.error).toBeNull()
    compiledRoutes = result.routes
  })

  function headersForPath(pathname: string) {
    const headers: Record<string, string> = {}
    for (const route of compiledRoutes ?? []) {
      if (route.src && new RegExp(route.src).test(pathname)) Object.assign(headers, route.headers)
    }
    return headers
  }

  it.each(['edge-runtime.d.ts', 'lib.deno.d.ts'])(
    'serves %s as TypeScript at root and base path',
    (file) => {
      for (const prefix of new Set(['', basePath])) {
        const headers = headersForPath(`${prefix}/deno/${file}`)
        expect(headers['content-type']).toBe('text/typescript')
        expect(headers['X-Content-Type-Options']).toBe('nosniff')
        expect(headers['Cache-Control']).toBeUndefined()
      }
    }
  )

  it.each([
    '/deno/edge-runtime.d.ts.map',
    '/deno/edge-runtime.d.tsx',
    '/deno/edge-runtime.dXts',
    '/deno/edge-runtime.d.ts/extra',
    '/deno/edge-runtime.d.tsextra',
    '/deno-other/edge-runtime.d.ts',
    '/edge-runtime.d.ts',
    '/img/example.ts',
  ])('does not override content type for %s', (pathname) => {
    for (const prefix of new Set(['', basePath])) {
      expect(headersForPath(`${prefix}${pathname}`)['content-type']).toBeUndefined()
    }
  })

  it.each(['/api/example.ts', '/api/deno/example.ts', '/_serverFn/example.ts'])(
    'preserves dynamic content type and private caching for %s',
    (pathname) => {
      for (const prefix of new Set(['', basePath])) {
        const headers = headersForPath(`${prefix}${pathname}`)
        expect(headers['content-type']).toBeUndefined()
        expect(headers['Cache-Control']).toBe('private, no-store')
      }
    }
  )

  it('preserves JSON content type for the flags endpoint', () => {
    expect(headersForPath('/.well-known/vercel/flags')['content-type']).toBe('application/json')
  })
})

it.each([undefined, 'next'])(
  'leaves the Next Vercel configuration untouched (%s)',
  async (framework) => {
    vi.resetModules()
    vi.stubEnv('STUDIO_FRAMEWORK', framework)
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/dashboard')
    const { config } = await import('./vercel')
    expect(config).toEqual({})
  }
)
