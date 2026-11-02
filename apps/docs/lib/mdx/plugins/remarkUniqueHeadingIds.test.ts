import { fromDocsMarkdown } from '~/features/directives/utils.server'
import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'
import { describe, expect, it, vi } from 'vitest'

import { remarkUniqueHeadingIds } from './remarkUniqueHeadingIds'

// listings whose heading `ContentListings` never renders
const { HIDDEN_HEADING_LISTINGS } = vi.hoisted(() => ({
  HIDDEN_HEADING_LISTINGS: {
    'test-progression': {
      id: 'test-progression',
      type: 'progression' as const,
      heading: 'Build it',
      items: [{ title: 'Step', href: '#step' }],
    },
    'test-no-items': { id: 'test-no-items', heading: 'Build it', items: [] },
  },
}))

vi.mock('~/lib/content-listings.utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/lib/content-listings.utils')>()
  return {
    ...actual,
    getContentListingById: (id: string) =>
      HIDDEN_HEADING_LISTINGS[id as keyof typeof HIDDEN_HEADING_LISTINGS] ??
      actual.getContentListingById(id),
  }
})

// undefined means the heading keeps the id that `Heading` builds from its text
const getAssignedIds = (markdown: string) => {
  const root: Root = fromDocsMarkdown(markdown)
  remarkUniqueHeadingIds()(root)
  const ids: (string | undefined)[] = []
  visit(root, (node) => {
    if (node.type === 'heading') {
      const id = Object.entries(node.data?.hProperties ?? {}).find(([key]) => key === 'id')?.[1]
      ids.push(typeof id === 'string' ? id : undefined)
    }
    if (node.type === 'mdxJsxFlowElement') {
      const headingId = node.attributes.find(
        (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'headingId'
      )?.value
      ids.push(typeof headingId === 'string' ? headingId : undefined)
    }
  })
  return ids
}

describe('remarkUniqueHeadingIds', () => {
  it('keeps the first id and gives each repeat the next suffix', () => {
    expect(getAssignedIds('## Example\n\n## Example\n\n### Example')).toEqual([
      undefined,
      'example-1',
      'example-2',
    ])
  })

  it('skips a suffix that another heading already uses', () => {
    expect(getAssignedIds('## Example\n\n## Example 1\n\n## Example')).toEqual([
      undefined,
      undefined,
      'example-2',
    ])
  })

  it('leaves unique headings unchanged', () => {
    expect(getAssignedIds('## Install\n\n## Configure')).toEqual([undefined, undefined])
  })

  it('builds the id from inline code the same way the rendered heading does', () => {
    expect(getAssignedIds('## Use `select`\n\n## Use `select`')).toEqual([
      undefined,
      'use-select-1',
    ])
  })

  it('leaves image alt text out of the id, as the rendered heading does', () => {
    expect(getAssignedIds('## ![logo](a.png) Setup\n\n## ![logo](a.png) Setup')).toEqual([
      undefined,
      '-setup-1',
    ])
  })

  it('counts content listing headings with the markdown headings on the page', () => {
    expect(
      getAssignedIds(
        '### Build it\n\n<ContentListings id="supabase-way-database-build" />\n\n<ContentListings id="supabase-way-auth-build" />'
      )
    ).toEqual([undefined, 'build-it-1', 'build-it-2'])
  })

  it('skips listing headings that the page does not render', () => {
    expect(
      getAssignedIds(
        '### Build it\n\n<ContentListings id="test-progression" />\n\n<ContentListings id="test-no-items" />\n\n### Build it'
      )
    ).toEqual([undefined, undefined, undefined, 'build-it-1'])
  })

  it('ignores headings that the docs render without an id', () => {
    expect(getAssignedIds('# Example\n\n## Example')).toEqual([undefined, undefined])
  })
})
