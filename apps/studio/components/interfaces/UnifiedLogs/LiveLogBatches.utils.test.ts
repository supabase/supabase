import { assert, describe, expect, it } from 'vitest'

import { getNewLiveLogBatch, orderLiveLogRows } from './LiveLogBatches.utils'

const rows = (...ids: string[]) => ids.map((id) => ({ id }))

describe('Live log batches', () => {
  it('keeps successive arrivals together and preserves their response order', () => {
    const baseline = rows('initial', 'initial-older')
    const first = getNewLiveLogBatch(rows('first', 'initial', 'late', 'first'), baseline, 1)
    assert(first)
    const firstRows = orderLiveLogRows(
      rows('first', 'initial', 'late', 'initial-older'),
      [first],
      baseline.map((row) => row.id)
    )
    expect(firstRows).toEqual(rows('first', 'late', 'initial', 'initial-older'))

    const second = getNewLiveLogBatch(rows('first', 'second', 'late'), firstRows, 2)
    assert(second)
    expect(
      orderLiveLogRows(
        rows('first', 'second', 'late', 'initial', 'initial-older', 'older-page'),
        [second, first],
        baseline.map((row) => row.id)
      )
    ).toEqual(rows('second', 'first', 'late', 'initial', 'initial-older', 'older-page'))
    expect(second).toEqual({ ids: ['second'], refreshedAt: 2 })
  })

  it('does not create a batch for empty or duplicate-only polls', () => {
    expect(getNewLiveLogBatch([], rows('initial'), 1)).toBeUndefined()
    expect(getNewLiveLogBatch(rows('initial', 'initial'), rows('initial'), 1)).toBeUndefined()
  })

  it('handles empty baselines and rows removed from the query', () => {
    expect(getNewLiveLogBatch(rows('first', 'first'), [], 1)).toEqual({
      ids: ['first'],
      refreshedAt: 1,
    })
    expect(
      orderLiveLogRows(rows('remaining'), [{ ids: ['removed'], refreshedAt: 1 }], ['missing'])
    ).toEqual(rows('remaining'))
    expect(orderLiveLogRows([], [], [])).toEqual([])
  })
})
