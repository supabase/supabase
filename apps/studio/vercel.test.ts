import { createRequire } from 'node:module'
import type { VercelConfig } from '@vercel/config/v1'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Compile with the routing utilities consumed by the installed Vercel config SDK.
const require = createRequire(import.meta.url)
const vercelRequire = createRequire(require.resolve('@vercel/config/v1'))
const getTransformedRoutes: (config: { headers: VercelConfig['headers'] }) => {
  error: unknown
  routes: { src?: string; headers?: Record<string, string> }[] | null
} = vercelRequire('@vercel/routing-utils').getTransformedRoutes

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe.each(['', '/dashboard'])('Vercel headers with base path "%s"', (basePath) => {
  it('leaves only exact deployment metadata paths to the handler cache policy', async () => {
    vi.stubEnv('STUDIO_FRAMEWORK', 'tanstack')
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', basePath)
    const { config } = await import('./vercel')
    const compiled = getTransformedRoutes({ headers: config.headers })
    expect(compiled.error).toBeNull()
    expect(compiled.routes).not.toBeNull()

    function cacheHeaders(pathname: string) {
      return compiled.routes!.flatMap(({ src, headers }) =>
        src && new RegExp(src).test(pathname) && headers?.['Cache-Control']
          ? [headers['Cache-Control']]
          : []
      )
    }

    for (const prefix of basePath ? ['', basePath] : ['']) {
      expect(cacheHeaders(`${prefix}/api/get-deployment-commit`)).toEqual([])
      expect(cacheHeaders(`${prefix}/api/get-deployment-commit/`)).toEqual([])

      for (const path of [
        '/api/get-deployment-commit/extra',
        '/api/get-deployment-commit-other',
        '/api/get-deployment-commit.json',
        '/api/Get-deployment-commit',
        '/api/platform/profile',
        '/api/v1/projects/example/api-keys',
        '/api/status-page',
        '/_serverFn/function-id',
      ]) {
        expect(cacheHeaders(`${prefix}${path}`), `${prefix}${path}`).toEqual(['private, no-store'])
      }

      const securityRule = compiled.routes!.find(
        ({ src, headers }) =>
          src &&
          new RegExp(src).test(`${prefix}/api/get-deployment-commit`) &&
          headers?.['X-Frame-Options']
      )
      expect(securityRule).toBeDefined()
    }
  })

  it.each([undefined, 'next'])(
    'leaves the Next.js Vercel config empty for framework %s',
    async (framework) => {
      vi.stubEnv('STUDIO_FRAMEWORK', framework)
      vi.stubEnv('NEXT_PUBLIC_BASE_PATH', basePath)
      const { config, default: defaultConfig } = await import('./vercel')

      expect(config).toEqual({})
      expect(defaultConfig).toBe(config)
    }
  )
})

describe.each(['', '/dashboard'])('TanStack content types with base path "%s"', (basePath) => {
  let compiledRoutes: ReturnType<typeof getTransformedRoutes>['routes']

  beforeEach(async () => {
    vi.resetModules()
    vi.stubEnv('STUDIO_FRAMEWORK', 'tanstack')
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', basePath)
    const { config } = await import('./vercel')
    const result = getTransformedRoutes({ headers: config.headers })
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
