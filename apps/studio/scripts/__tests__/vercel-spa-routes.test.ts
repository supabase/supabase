import { describe, expect, it } from 'vitest'

import { buildSpaRoutes, buildStaticFileSrc, type StaticEntry } from '../vercel-spa-routes'

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
const staticEntries: StaticEntry[] = [
  { name: '_vercel', isDirectory: true },
  { name: 'img', isDirectory: true },
  { name: 'monaco-editor', isDirectory: true },
  { name: 'supabase-logo.svg', isDirectory: false },
]
const STATIC_FILE_SRC = '^/dashboard/((?:_vercel|img|monaco-editor)/.+|(?:supabase-logo\\.svg))$'

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
      '/dashboard',
      staticEntries
    )

    expect(routes.slice(2)).toEqual([
      { src: '/dashboard/_serverFn/(.*)', dest: '/__server' },
      { src: '/dashboard/api/(.*)', dest: '/__server' },
      { src: '/_serverFn/(.*)', dest: '/__server' },
      { src: '/api/(.*)', dest: '/__server' },
      { src: `${IMMUTABLE}/(.*)`, status: 404 },
      { src: STATIC_FILE_SRC, dest: '/$1' },
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

  it('omits the public-file rewrite without a base path or static entries', () => {
    expect(
      buildSpaRoutes([filesystem, functionCatchAll], '/__server', IMMUTABLE, '', staticEntries)
    ).not.toContainEqual(expect.objectContaining({ dest: '/$1' }))
    expect(
      buildSpaRoutes([filesystem, functionCatchAll], '/__server', IMMUTABLE, '/dashboard')
    ).not.toContainEqual(expect.objectContaining({ dest: '/$1' }))
    expect(buildStaticFileSrc('/dashboard', [])).toBeUndefined()
  })

  // Files present in the static output, resolved after a rewrite.
  const existingFiles = new Set([
    `${IMMUTABLE}/chunk.js`,
    `${IMMUTABLE}/editor.worker.js`,
    `${IMMUTABLE}/styles.css`,
    '/img/logo.svg',
    '/supabase-logo.svg',
  ])

  // Models routing after `handle: filesystem` missed: the first matching rule
  // wins, and a rewrite ends routing, so its destination must exist.
  function resolveAfterFilesystemMiss(pathname: string) {
    const routes = buildSpaRoutes(
      [filesystem, functionCatchAll],
      '/__server',
      IMMUTABLE,
      '/dashboard',
      staticEntries
    )
    const after = routes.slice(routes.findIndex((r) => r.handle === 'filesystem') + 1)
    const rule = after.find(({ src }) => src && new RegExp(`^${src}$`).test(pathname))
    if (!rule) return undefined
    if (rule.status) return rule.status
    const destination = pathname.replace(new RegExp(`^${rule.src}$`), rule.dest!)
    if (destination === '/__server' || destination === '/_shell.html') return destination
    return existingFiles.has(destination) ? destination : 404
  }

  it.each([
    [`/dashboard${IMMUTABLE}/chunk.js`, `${IMMUTABLE}/chunk.js`],
    [`/dashboard${IMMUTABLE}/editor.worker.js`, `${IMMUTABLE}/editor.worker.js`],
    [`/dashboard${IMMUTABLE}/styles.css`, `${IMMUTABLE}/styles.css`],
    ['/dashboard/img/logo.svg', '/img/logo.svg'],
    ['/dashboard/supabase-logo.svg', '/supabase-logo.svg'],
    // Missing hashed chunks 404 rather than becoming the shell
    [`/dashboard${IMMUTABLE}/old-chunk.js`, 404],
    [`${IMMUTABLE}/old-chunk.js`, 404],
    ['/dashboard/api/export.json', '/__server'],
    ['/dashboard/_serverFn/function-id', '/__server'],
    ['/dashboard/project/example/editor', '/_shell.html'],
    // Deep links whose last segment contains a dot are pages, not files
    ['/dashboard/project/example/storage/files/buckets/my.bucket', '/_shell.html'],
    ['/dashboard/project/example/functions/hello.world', '/_shell.html'],
    ['/dashboard/img', '/_shell.html'],
    ['/dashboard/img/', '/_shell.html'],
    ['/dashboard/img.png', '/_shell.html'],
    // Unprefixed paths are unchanged
    ['/api/export.json', '/__server'],
    ['/_serverFn/function-id', '/__server'],
    ['/project/example/storage/files/buckets/my.bucket', '/_shell.html'],
  ])('routes %s to %s after the filesystem misses', (pathname, destination) => {
    expect(resolveAfterFilesystemMiss(pathname)).toBe(destination)
  })
})
