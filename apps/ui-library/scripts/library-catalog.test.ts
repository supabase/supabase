import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { describe, it } from 'node:test'

import { componentPages, mcpBlocks, oauthBlocks, platformBlocks } from '../config/docs'
import { getLibraryBlockHref, libraryBlocks, libraryCategories } from '../config/library'

describe('library catalog', () => {
  it('keeps every existing block discoverable with a valid category and documentation route', () => {
    const existingItems = [
      ...componentPages.items,
      ...oauthBlocks.items,
      ...mcpBlocks.items,
      ...platformBlocks.items,
    ]

    for (const item of existingItems) {
      const block = libraryBlocks.find((block) => block.href === item.href)
      assert.ok(block, `${item.title} must remain in the catalog`)
      assert.ok(libraryCategories.some((category) => category.name === block.category))
      assert.ok(existsSync(new URL(`../content${block.href}.mdx`, import.meta.url)))
      for (const framework of block.supportedFrameworks ?? []) {
        const href = getLibraryBlockHref(block, framework)
        assert.ok(existsSync(new URL(`../content${href}.mdx`, import.meta.url)), href)
      }
    }
  })

  it('uses a supported framework and falls back to an existing route otherwise', () => {
    const oauth = libraryBlocks.find((block) => block.slug === 'oauth-consent')!
    const monaco = libraryBlocks.find((block) => block.slug === 'realtime-monaco')!
    const infiniteQuery = libraryBlocks.find((block) => block.slug === 'infinite-query')!

    assert.equal(getLibraryBlockHref(oauth, 'react-router'), '/docs/react-router/oauth-consent')
    assert.equal(getLibraryBlockHref(monaco, 'vue'), '/docs/nextjs/realtime-monaco')
    assert.equal(getLibraryBlockHref(infiniteQuery, 'nextjs'), '/docs/react/infinite-query')
  })

  it('includes starter apps as blocks with unique slugs and internal documentation routes', () => {
    assert.equal(new Set(libraryBlocks.map((block) => block.slug)).size, libraryBlocks.length)
    const starters = libraryBlocks.filter((block) => block.category === 'Starter apps')
    assert.ok(starters.length > 0)
    for (const starter of starters) {
      assert.equal(starter.href, `/docs/starters/${starter.slug}`)
      assert.ok(existsSync(new URL(`../content${starter.href}.mdx`, import.meta.url)))
      assert.notEqual(starter.external, true)
      assert.equal(getLibraryBlockHref(starter, 'vue'), starter.href)
    }
  })
})
