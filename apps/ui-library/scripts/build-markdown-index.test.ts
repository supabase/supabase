import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { libraryBlocks, libraryCategories } from '../config/library'
import { buildIndexMarkdown } from './build-markdown-index'

describe('index markdown', () => {
  const markdown = buildIndexMarkdown(new Date('2025-01-01T00:00:00.000Z'))

  it('lists every block under its category', () => {
    for (const category of libraryCategories) {
      assert.ok(markdown.includes(`## ${category.name}`), `${category.name} needs a section`)
    }

    for (const block of libraryBlocks) {
      assert.ok(
        markdown.includes(`[${block.title}](https://supabase.com/library${block.href}.md)`),
        `${block.slug} needs a markdown link`
      )
      assert.ok(markdown.includes(block.description), `${block.slug} needs its description`)
    }
  })

  it('names the frameworks a block supports', () => {
    const infiniteQuery = libraryBlocks.find((block) => block.slug === 'infinite-query')!
    assert.ok(
      markdown.includes(`Frameworks: ${infiniteQuery.supportedFrameworks!.join(', ')}.`),
      'framework variants need to be discoverable'
    )
  })

  it('links the getting started guides and the full page index', () => {
    assert.ok(markdown.includes('https://supabase.com/library/docs/getting-started/quickstart.md'))
    assert.ok(markdown.includes('https://supabase.com/library/llms.txt'))
  })
})
