import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { compileRedirectRules, loadWwwRedirects, type RedirectRule } from './www-redirects.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '../../..')

test('loadWwwRedirects reads the real redirects.js and contains a known entry', () => {
  const rules = loadWwwRedirects(REPO_ROOT)

  assert.ok(rules.length > 400, `expected hundreds of redirects, got ${rules.length}`)

  // If this ever fails, it's telling you something real changed in
  // apps/www/lib/redirects.js — update the fixture below, don't just delete it.
  const match = rules.find((rule) => rule.source === '/docs/careers')
  assert.ok(match, 'expected /docs/careers to still be a redirect source')
  assert.equal(match?.destination, 'https://about.supabase.com/careers')
  assert.equal(match?.permanent, false)
})

test('loadWwwRedirects skips conditional (`has`) entries', () => {
  const rules = loadWwwRedirects(REPO_ROOT)
  // This source is host-conditional in the real file; a literal path match
  // would be wrong here since it applies only on a different host.
  assert.ok(
    !rules.some((rule) => rule.source === '/:path*' && rule.destination.includes('design-system')),
    'expected the host-conditional design-system catch-all to be filtered out'
  )
})

test('compileRedirectRules matches an exact literal source', () => {
  const rules: RedirectRule[] = [
    {
      source: '/docs/guides/database/data-api',
      destination: '/docs/guides/api/data-api',
      permanent: true,
    },
  ]
  const findRedirect = compileRedirectRules(rules)

  assert.deepEqual(findRedirect('/docs/guides/database/data-api'), {
    source: '/docs/guides/database/data-api',
    destination: '/docs/guides/api/data-api',
    permanent: true,
  })
  assert.equal(findRedirect('/docs/guides/database/data-api-extra'), null)
})

test('compileRedirectRules substitutes a `:name*` wildcard into the destination', () => {
  const rules: RedirectRule[] = [
    {
      source: '/docs/guides/reports/:match*',
      destination: '/docs/guides/observability/:match*',
      permanent: true,
    },
  ]
  const findRedirect = compileRedirectRules(rules)

  assert.deepEqual(findRedirect('/docs/guides/reports/foo/bar'), {
    source: '/docs/guides/reports/:match*',
    destination: '/docs/guides/observability/foo/bar',
    permanent: true,
  })
})

test('compileRedirectRules matches a literal destination containing a query string, when the source has no params', () => {
  const rules: RedirectRule[] = [
    {
      source: '/docs/guides/auth/server-side/nextjs',
      destination:
        '/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs',
      permanent: false,
    },
  ]
  const findRedirect = compileRedirectRules(rules)

  // path-to-regexp's compile() cannot parse a `?query=string` destination as
  // a template. Since the source captured no params, no substitution is
  // needed, and the literal destination is returned as-is rather than
  // crashing the whole matcher over an unrelated rule.
  const match = findRedirect('/docs/guides/auth/server-side/nextjs')
  assert.deepEqual(match, {
    source: '/docs/guides/auth/server-side/nextjs',
    destination:
      '/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs',
    permanent: false,
  })
})

test('compileRedirectRules treats a dynamic source with an uncompilable destination as no match', () => {
  const rules: RedirectRule[] = [
    {
      source: '/docs/careers/:match*',
      destination: 'https://about.supabase.com/careers//:match*',
      permanent: true,
    },
  ]
  const findRedirect = compileRedirectRules(rules)

  // The source captured params, so a substitution IS needed, but the
  // destination is an absolute URL path-to-regexp can't compile. Must not throw.
  assert.equal(findRedirect('/docs/careers/foo'), null)
})

test('compileRedirectRules applies the first matching rule, same order Vercel would', () => {
  const rules: RedirectRule[] = [
    { source: '/docs/guides/a', destination: '/docs/guides/first', permanent: true },
    { source: '/docs/guides/a', destination: '/docs/guides/second', permanent: true },
  ]
  const findRedirect = compileRedirectRules(rules)

  assert.equal(findRedirect('/docs/guides/a')?.destination, '/docs/guides/first')
})

test('compileRedirectRules never throws across every real rule in redirects.js', () => {
  const rules = loadWwwRedirects(REPO_ROOT)
  const findRedirect = compileRedirectRules(rules)

  for (const rule of rules) {
    // Replace any `:param*`/`:param` placeholder with a literal segment so
    // dynamic sources are exercised too, not just literal ones.
    const probe = rule.source.replace(/:[^/]+\*?/g, 'probe-value')
    assert.doesNotThrow(
      () => findRedirect(probe),
      `threw while matching against source ${rule.source}`
    )
  }
})
