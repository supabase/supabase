import { describe, expect, it } from 'vitest'

import { buildSpaRoutes } from '../vercel-spa-routes'

const IMMUTABLE = '/_vercel/immutable/initial/nitro'
const cacheRule = {
  headers: { 'cache-control': 'public, max-age=31536000, immutable' },
  src: `${IMMUTABLE}/(.*)`,
}
const skewCookieRule = {
  src: '/.*',
  has: [{ type: 'header', key: 'Sec-Fetch-Dest', value: 'document' }],
  headers: { 'Set-Cookie': '__vdpl=dpl_123; Path=/; SameSite=Lax; Secure; HttpOnly' },
  continue: true,
}
const filesystem = { handle: 'filesystem' }
const functionCatchAll = { src: '/(.*)', dest: '/__server' }

describe('buildSpaRoutes', () => {
  it('keeps the rules ahead of the filesystem handler and replaces the function catch-all', () => {
    const routes = buildSpaRoutes(
      [cacheRule, skewCookieRule, filesystem, functionCatchAll],
      '/__server',
      IMMUTABLE
    )

    expect(routes).toEqual([
      cacheRule,
      skewCookieRule,
      filesystem,
      { src: '/_serverFn/(.*)', dest: '/__server' },
      { src: '/api/(.*)', dest: '/__server' },
      { src: `${IMMUTABLE}/(.*)`, status: 404 },
      { src: '/(.*)', dest: '/_shell.html' },
    ])
  })

  it('adds prefixed rules and a public-file rewrite under a base path', () => {
    const routes = buildSpaRoutes(
      [cacheRule, filesystem, functionCatchAll],
      '/__server',
      IMMUTABLE,
      '/dashboard'
    )

    expect(routes.slice(2)).toEqual([
      { src: '/dashboard/_serverFn/(.*)', dest: '/__server' },
      { src: '/dashboard/api/(.*)', dest: '/__server' },
      { src: '/_serverFn/(.*)', dest: '/__server' },
      { src: '/api/(.*)', dest: '/__server' },
      { src: `${IMMUTABLE}/(.*)`, status: 404 },
      { src: '/dashboard/(.*\\.\\w+)', dest: '/$1' },
      { src: '/(.*)', dest: '/_shell.html' },
    ])
  })

  it('fails loudly when Nitro output changes shape', () => {
    expect(() => buildSpaRoutes([functionCatchAll], '/__server', '/assets')).toThrow(
      /no \{ handle: "filesystem" \}/
    )
    expect(() => buildSpaRoutes([filesystem], '/__server', '/assets')).toThrow(
      /catch-all .* was not found/
    )
  })

  it.each([
    [`/dashboard${IMMUTABLE}/old-chunk.js`, `${IMMUTABLE}/old-chunk.js`],
    [`/dashboard${IMMUTABLE}/editor.worker.js`, `${IMMUTABLE}/editor.worker.js`],
    [`/dashboard${IMMUTABLE}/styles.css`, `${IMMUTABLE}/styles.css`],
    ['/dashboard/img/logo.svg', '/img/logo.svg'],
    ['/dashboard/api/export.json', '/__server'],
    ['/dashboard/_serverFn/function-id', '/__server'],
    ['/dashboard/project/example/editor', '/_shell.html'],
  ])('routes %s to %s after the filesystem misses', (pathname, destination) => {
    const routes = buildSpaRoutes(
      [filesystem, functionCatchAll],
      '/__server',
      IMMUTABLE,
      '/dashboard'
    )
    const rule = routes.find(({ src }) => src && new RegExp(`^${src}$`).test(pathname))

    expect(rule?.dest).toBeDefined()
    expect(pathname.replace(new RegExp(`^${rule!.src}$`), rule!.dest!)).toBe(destination)
  })
})
