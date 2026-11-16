import { describe, expect, it } from 'vitest'

import { foldTimelineSteps } from './LogTimeline.utils'

const logs = 'abcdefghi'.split('').map((id) => ({ id }))

describe('foldTimelineSteps', () => {
  it.each([
    ['a', undefined, 0, 6],
    ['c', undefined, 0, 6],
    ['d', 'd', 0, 5],
    ['g', 'g', 3, 2],
    ['i', 'i', 5, 0],
    ['missing', undefined, 0, 6],
    [undefined, undefined, 0, 6],
  ])(
    'keeps %s in order between its hidden ranges',
    (activeLogId, activeId, hiddenBefore, hiddenAfter) => {
      const fold = foldTimelineSteps(logs, { activeLogId, isExpanded: false, collapsedCount: 3 })
      expect(fold.leadingLogs).toEqual(logs.slice(0, 3))
      expect(fold.activeLog?.id).toBe(activeId)
      expect(fold.hiddenBefore).toBe(hiddenBefore)
      expect(fold.hiddenAfter).toBe(hiddenAfter)
      expect(fold.leadingLogs.length + (fold.activeLog ? 1 : 0) + hiddenBefore + hiddenAfter).toBe(
        logs.length
      )
    }
  )

  it.each([
    { isExpanded: true, collapsedCount: 3 },
    { isExpanded: false },
    { isExpanded: false, collapsedCount: 9 },
    { isExpanded: false, collapsedCount: 10 },
  ])('shows all logs when expanded, short, or not folding: %o', (options) => {
    expect(foldTimelineSteps(logs, { activeLogId: 'g', ...options })).toEqual({
      leadingLogs: logs,
      hiddenBefore: 0,
      hiddenAfter: 0,
    })
  })

  it('handles an empty timeline', () => {
    expect(foldTimelineSteps([], { isExpanded: false, collapsedCount: 3 })).toEqual({
      leadingLogs: [],
      hiddenBefore: 0,
      hiddenAfter: 0,
    })
  })

  it.each([0, -1])('keeps the active log visible with a count of %s', (collapsedCount) => {
    expect(
      foldTimelineSteps(logs, { activeLogId: 'd', isExpanded: false, collapsedCount })
    ).toEqual({
      leadingLogs: [],
      activeLog: logs[3],
      hiddenBefore: 3,
      hiddenAfter: 5,
    })
  })
})
