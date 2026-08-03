import { describe, expect, it } from 'vitest'

import { GraphQLCollectionBuilder, type IPaginationArgs } from './connections'

const buildInMemory = async (args: IPaginationArgs) => {
  const result = await GraphQLCollectionBuilder.create({ items: ['A', 'B', 'C'], args })
  return result.unwrap()
}

describe('GraphQLCollectionBuilder in-memory pagination', () => {
  it('returns all items when no pagination args are provided', async () => {
    const page = await buildInMemory({})
    expect(page.nodes).toStrictEqual(['A', 'B', 'C'])
    expect(page.pageInfo.hasNextPage).toBe(false)
    expect(page.pageInfo.hasPreviousPage).toBe(false)
  })

  it('excludes the first item when paginating after the index-0 cursor', async () => {
    // Cursors are stringified array indices, so the first item's cursor is "0".
    // A falsy guard previously dropped this cursor, wrongly including item "A".
    const page = await buildInMemory({ after: '0' })
    expect(page.nodes).toStrictEqual(['B', 'C'])
    expect(page.pageInfo.hasPreviousPage).toBe(true)
  })

  it('returns an empty page when paginating before the index-0 cursor', async () => {
    const page = await buildInMemory({ before: '0' })
    expect(page.nodes).toStrictEqual([])
    expect(page.pageInfo.hasNextPage).toBe(true)
  })

  it('still paginates correctly for non-zero cursors', async () => {
    const afterFirst = await buildInMemory({ after: '1' })
    expect(afterFirst.nodes).toStrictEqual(['C'])

    const beforeLast = await buildInMemory({ before: '2' })
    expect(beforeLast.nodes).toStrictEqual(['A', 'B'])
  })
})
