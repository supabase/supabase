import { describe, expect, it } from 'vitest'

import { foldTimelineSteps, type TimelineItem } from './LogTimeline.utils'

const logs = 'abcdefghi'.split('').map((id) => ({ id }))

/** Reads a fold the way the timeline shows it, e.g. `a b c +3 g +2`. */
const describeFold = (items: TimelineItem<{ id: string }>[]) =>
  items.map((item) => (item.type === 'log' ? item.log.id : `+${item.count}`)).join(' ')

const fold = (activeLogId: string | undefined, collapsedCount?: number, isExpanded = false) =>
  describeFold(foldTimelineSteps(logs, { activeLogId, isExpanded, collapsedCount }))

describe('foldTimelineSteps', () => {
  it.each([
    ['a', 'a b c +6'],
    ['c', 'a b c +6'],
    ['d', 'a b c d +5'],
    ['g', 'a b c +3 g +2'],
    ['i', 'a b c +5 i'],
    ['missing', 'a b c +6'],
    [undefined, 'a b c +6'],
  ])('keeps the open log %s in order between the hidden runs', (activeLogId, expected) => {
    expect(fold(activeLogId, 3)).toBe(expected)
  })

  // A "+1 more" row takes the same space as the log it hides, so the log is shown instead
  it.each([
    ['e', 'a b c d e +4'],
    ['h', 'a b c +4 h i'],
  ])('shows a lone hidden log next to the open log %s', (activeLogId, expected) => {
    expect(fold(activeLogId, 3)).toBe(expected)
  })

  it('shows a timeline one log longer than the fold in full', () => {
    const items = foldTimelineSteps(logs.slice(0, 4), { isExpanded: false, collapsedCount: 3 })
    expect(describeFold(items)).toBe('a b c d')
  })

  it.each([
    { collapsedCount: 3, isExpanded: true },
    { collapsedCount: undefined, isExpanded: false },
    { collapsedCount: 9, isExpanded: false },
  ])(
    'shows all logs when expanded, short, or not folding: %o',
    ({ collapsedCount, isExpanded }) => {
      expect(fold('g', collapsedCount, isExpanded)).toBe('a b c d e f g h i')
    }
  )

  it('handles an empty timeline', () => {
    expect(foldTimelineSteps([], { isExpanded: false, collapsedCount: 3 })).toEqual([])
  })

  it.each([0, -1])('keeps the open log visible with a count of %s', (collapsedCount) => {
    expect(fold('d', collapsedCount)).toBe('+3 d +5')
  })
})
