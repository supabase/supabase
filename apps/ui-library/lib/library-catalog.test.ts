import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { componentPages, mcpBlocks, oauthBlocks, platformBlocks } from '../config/docs'
import { getLibraryBlockHref, libraryBlocks, libraryCategories } from '../config/library'
import { collectMdxFiles, getDocSlug } from './library-documents'

describe('library catalog', () => {
  it('accounts for every block guide and framework variant in the content directory', () => {
    const contentDirectory = fileURLToPath(new URL('../content/docs', import.meta.url))
    const catalogRoutes = new Set(
      libraryBlocks.flatMap((block) => [
        block.href,
        ...(block.supportedFrameworks ?? []).map((framework) =>
          getLibraryBlockHref(block, framework)
        ),
      ])
    )
    // These guides are reachable directly but intentionally absent from the block catalog.
    const unlistedRoutes = new Set([
      '/docs/getting-started/introduction',
      '/docs/getting-started/quickstart',
      '/docs/getting-started/faq',
      '/docs/nextjs/tanstack-db',
    ])
    const documentRoutes = new Set(
      collectMdxFiles(contentDirectory).map(
        (file) => `/docs/${getDocSlug(path.relative(contentDirectory, file))}`
      )
    )

    for (const route of documentRoutes) {
      expect(
        catalogRoutes.has(route) || unlistedRoutes.has(route),
        `${route} needs a catalog entry`
      ).toBe(true)
    }
    for (const route of [...catalogRoutes, ...unlistedRoutes]) {
      expect(documentRoutes.has(route), `${route} must resolve to a guide`).toBe(true)
    }
    for (const block of libraryBlocks) {
      expect(block.title.trim(), `${block.slug} needs a title`).toBeTruthy()
      expect(block.description?.trim(), `${block.slug} needs a description`).toBeTruthy()
      expect(block.preview, `${block.slug} needs a preview`).toBeTruthy()
      expect(libraryCategories.some((category) => category.name === block.category)).toBe(true)
    }
  })

  it('keeps every existing block discoverable with a valid category and documentation route', () => {
    const existingItems = [
      ...componentPages.items,
      ...oauthBlocks.items,
      ...mcpBlocks.items,
      ...platformBlocks.items,
    ]

    for (const item of existingItems) {
      const block = libraryBlocks.find((block) => block.href === item.href)
      if (!block) throw new Error(`${item.title} must remain in the catalog`)
      expect(libraryCategories.some((category) => category.name === block.category)).toBe(true)
      expect(existsSync(new URL(`../content${block.href}.mdx`, import.meta.url))).toBe(true)
      for (const framework of block.supportedFrameworks ?? []) {
        const href = getLibraryBlockHref(block, framework)
        expect(existsSync(new URL(`../content${href}.mdx`, import.meta.url)), href).toBe(true)
      }
    }
  })

  it('uses a supported framework and falls back to an existing route otherwise', () => {
    const oauth = libraryBlocks.find((block) => block.slug === 'oauth-consent')!
    const monaco = libraryBlocks.find((block) => block.slug === 'realtime-monaco')!
    const infiniteQuery = libraryBlocks.find((block) => block.slug === 'infinite-query')!

    expect(getLibraryBlockHref(oauth, 'react-router')).toBe('/docs/react-router/oauth-consent')
    expect(getLibraryBlockHref(monaco, 'vue')).toBe('/docs/nextjs/realtime-monaco')
    expect(getLibraryBlockHref(infiniteQuery, 'nextjs')).toBe('/docs/react/infinite-query')
  })

  it('includes starter apps as blocks with unique slugs and internal documentation routes', () => {
    expect(new Set(libraryBlocks.map((block) => block.slug)).size).toBe(libraryBlocks.length)
    const starters = libraryBlocks.filter((block) => block.category === 'Starter apps')
    expect(starters.length > 0).toBe(true)
    for (const starter of starters) {
      expect(starter.href).toBe(`/docs/starters/${starter.slug}`)
      expect(existsSync(new URL(`../content${starter.href}.mdx`, import.meta.url))).toBe(true)
      expect(starter.external).not.toBe(true)
      expect(getLibraryBlockHref(starter, 'vue')).toBe(starter.href)
    }
  })
})
