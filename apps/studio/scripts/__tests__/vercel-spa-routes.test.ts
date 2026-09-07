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
})
