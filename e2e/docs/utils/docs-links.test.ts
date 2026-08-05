import assert from 'node:assert/strict'
import { test } from 'node:test'

import { formatLinkFailure } from './docs-links.ts'

test('formatLinkFailure names the redirect and the destination to link to', () => {
  const message = formatLinkFailure({
    url: 'https://docs-preview.vercel.app/docs/guides/database/data-api',
    status: 404,
    lookupRedirect: () => ({
      source: '/docs/guides/database/data-api',
      destination: '/docs/guides/api/securing-your-api',
      permanent: true,
    }),
  })

  assert.match(message, /should resolve \(status 404\)/)
  assert.match(
    message,
    /This link is a redirect: \/docs\/guides\/database\/data-api → \/docs\/guides\/api\/securing-your-api/
  )
  assert.match(message, /Fix: change the link to \/docs\/guides\/api\/securing-your-api\./)
})

test('formatLinkFailure adds nothing when no redirect covers the path', () => {
  const message = formatLinkFailure({
    url: 'https://docs-preview.vercel.app/docs/guides/typo-ed-link',
    status: 404,
    lookupRedirect: () => null,
  })

  assert.equal(
    message,
    'https://docs-preview.vercel.app/docs/guides/typo-ed-link should resolve (status 404)'
  )
})

test('formatLinkFailure reports a network error in place of a status', () => {
  const message = formatLinkFailure({
    url: 'https://docs-preview.vercel.app/docs/guides/unreachable',
    status: 'socket hang up',
    lookupRedirect: () => null,
  })

  assert.match(message, /should resolve \(status socket hang up\)/)
})
