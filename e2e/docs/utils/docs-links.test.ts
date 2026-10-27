import assert from 'node:assert/strict'
import test from 'node:test'

import {
  articleSelectorForPagePath,
  docsOwnedLinkTargets,
  GUIDE_ARTICLE_SELECTOR,
  TROUBLESHOOTING_ARTICLE_SELECTOR,
} from './docs-links.ts'

const baseURL = 'https://supabase.com'
const pageUrl = 'https://supabase.com/docs/guides/auth/redirect-urls'

test('keeps a docs-owned link without an anchor', () => {
  assert.deepEqual(docsOwnedLinkTargets(['/docs/guides/database'], pageUrl, baseURL), [
    { url: 'https://supabase.com/docs/guides/database' },
  ])
})

test('keeps the anchor of a link to another page', () => {
  assert.deepEqual(
    docsOwnedLinkTargets(
      ['/docs/guides/platform/ipv4-address#understanding-ip-addresses'],
      pageUrl,
      baseURL
    ),
    [
      {
        url: 'https://supabase.com/docs/guides/platform/ipv4-address',
        anchor: 'understanding-ip-addresses',
      },
    ]
  )
})

test('targets the current page for a same-page anchor', () => {
  assert.deepEqual(docsOwnedLinkTargets(['#use-wildcards'], `${pageUrl}#top`, baseURL), [
    { url: pageUrl, anchor: 'use-wildcards' },
  ])
})

test('skips a bare # link', () => {
  assert.deepEqual(docsOwnedLinkTargets(['#'], pageUrl, baseURL), [])
})

test('percent-decodes the anchor', () => {
  assert.deepEqual(docsOwnedLinkTargets(['/docs/guides/database#caf%C3%A9'], pageUrl, baseURL), [
    { url: 'https://supabase.com/docs/guides/database', anchor: 'café' },
  ])
})

test('lists each link once, in sorted order', () => {
  assert.deepEqual(
    docsOwnedLinkTargets(
      [
        '/docs/guides/storage',
        '/docs/guides/database#b',
        '/docs/guides/storage',
        '/docs/guides/database#a',
      ],
      pageUrl,
      baseURL
    ),
    [
      { url: 'https://supabase.com/docs/guides/database', anchor: 'a' },
      { url: 'https://supabase.com/docs/guides/database', anchor: 'b' },
      { url: 'https://supabase.com/docs/guides/storage' },
    ]
  )
})

test('skips links outside the docs on this origin', () => {
  assert.deepEqual(
    docsOwnedLinkTargets(
      [
        'https://github.com/supabase/supabase#readme',
        '/dashboard/projects#new',
        'mailto:support@supabase.com',
      ],
      pageUrl,
      baseURL
    ),
    []
  )
})

test('uses the guide article for guide routes', () => {
  assert.equal(
    articleSelectorForPagePath('/docs/guides/auth/redirect-urls'),
    GUIDE_ARTICLE_SELECTOR
  )
})

test('uses the troubleshooting article for troubleshooting routes', () => {
  assert.equal(
    articleSelectorForPagePath('/docs/guides/troubleshooting/authentication'),
    TROUBLESHOOTING_ARTICLE_SELECTOR
  )
  assert.equal(
    articleSelectorForPagePath('https://supabase.com/docs/guides/troubleshooting/authentication'),
    TROUBLESHOOTING_ARTICLE_SELECTOR
  )
})

test('uses main content for reference and landing routes', () => {
  assert.equal(articleSelectorForPagePath('/docs/reference/javascript/select'), 'main')
  assert.equal(
    articleSelectorForPagePath('https://supabase.com/docs/reference/javascript/select'),
    'main'
  )
  assert.equal(articleSelectorForPagePath('/docs'), 'main')
})
