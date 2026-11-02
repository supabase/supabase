import { fromDocsMarkdown } from '~/features/directives/utils.server'
import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'
import { describe, expect, it } from 'vitest'

import { remarkUniqueHeadingIds } from './remarkUniqueHeadingIds'

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

  it('counts content listing headings with the markdown headings on the page', () => {
    expect(
      getAssignedIds(
        '### Build it\n\n<ContentListings id="supabase-way-database-build" />\n\n<ContentListings id="supabase-way-auth-build" />'
      )
    ).toEqual([undefined, 'build-it-1', 'build-it-2'])
  })

  it('ignores headings that the docs render without an id', () => {
    expect(getAssignedIds('# Example\n\n## Example')).toEqual([undefined, undefined])
  })
})
