import { describe, expect, it } from 'vitest'

import { removeContentFromList } from './content-delete-mutation'
import type { ContentData } from './content-query'

const makeListData = (ids: string[]): ContentData => ({
  cursor: 'next-cursor',
  content: ids.map((id) => ({ id, name: id, type: 'report' })) as ContentData['content'],
})

describe('removeContentFromList', () => {
  it('removes a single matching id', () => {
    const result = removeContentFromList(makeListData(['a', 'b', 'c']), ['b'])
    expect(result.content.map((item) => item.id)).toEqual(['a', 'c'])
  })

  it('removes multiple matching ids', () => {
    const result = removeContentFromList(makeListData(['a', 'b', 'c']), ['a', 'c'])
    expect(result.content.map((item) => item.id)).toEqual(['b'])
  })

  it('leaves the list unchanged when no ids match', () => {
    const result = removeContentFromList(makeListData(['a', 'b']), ['x'])
    expect(result.content.map((item) => item.id)).toEqual(['a', 'b'])
  })

  it('preserves sibling fields such as cursor', () => {
    const result = removeContentFromList(makeListData(['a']), ['a'])
    expect(result.cursor).toBe('next-cursor')
  })

  it('does not mutate the input data', () => {
    const input = makeListData(['a', 'b'])
    removeContentFromList(input, ['a'])
    expect(input.content.map((item) => item.id)).toEqual(['a', 'b'])
  })
})
