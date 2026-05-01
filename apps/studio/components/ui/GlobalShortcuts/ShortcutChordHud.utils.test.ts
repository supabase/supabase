import { describe, expect, it } from 'vitest'

import {
  getVisibleShortcutChord,
  type ShortcutSequenceRegistration,
} from './ShortcutChordHud.utils'

const makeSequence = (
  overrides: Partial<ShortcutSequenceRegistration> &
    Pick<ShortcutSequenceRegistration, 'id' | 'sequence'>
): ShortcutSequenceRegistration => ({
  id: overrides.id,
  sequence: overrides.sequence,
  options: overrides.options ?? {},
  triggerCount: overrides.triggerCount ?? 0,
  matchedStepCount: overrides.matchedStepCount ?? 0,
  partialMatchLastKeyTime: overrides.partialMatchLastKeyTime ?? 0,
})

describe('getVisibleShortcutChord', () => {
  it('collapses shared G-prefix matches into a single visible chord', () => {
    const now = 2_000
    const chord = getVisibleShortcutChord(
      [
        makeSequence({
          id: 'nav.home',
          sequence: ['G', 'H'],
          matchedStepCount: 1,
          partialMatchLastKeyTime: 1_700,
        }),
        makeSequence({
          id: 'nav.table',
          sequence: ['G', 'T'],
          matchedStepCount: 1,
          partialMatchLastKeyTime: 1_700,
        }),
      ],
      now
    )

    expect(chord).toMatchObject({ steps: ['G'], matchedStepCount: 1, remainingMs: 700 })
  })

  it('surfaces contextual non-navigation prefixes like I', () => {
    const chord = getVisibleShortcutChord(
      [
        makeSequence({
          id: 'table-editor.insert-row',
          sequence: ['I', 'R'],
          matchedStepCount: 1,
          partialMatchLastKeyTime: 4_200,
        }),
      ],
      4_500
    )

    expect(chord).toMatchObject({ steps: ['I'], matchedStepCount: 1 })
  })

  it('ignores expired partial matches even if TanStack still reports progress', () => {
    const chord = getVisibleShortcutChord(
      [
        makeSequence({
          id: 'nav.home',
          sequence: ['G', 'H'],
          matchedStepCount: 1,
          partialMatchLastKeyTime: 1_000,
        }),
      ],
      2_000
    )

    expect(chord).toBeNull()
  })

  it('prefers the most recent chord, then the most advanced one', () => {
    const olderButLonger = makeSequence({
      id: 'longer',
      sequence: ['G', 'T', 'X'],
      matchedStepCount: 2,
      partialMatchLastKeyTime: 4_000,
    })
    const newer = makeSequence({
      id: 'newer',
      sequence: ['I', 'R'],
      matchedStepCount: 1,
      partialMatchLastKeyTime: 4_100,
    })

    expect(getVisibleShortcutChord([olderButLonger, newer], 4_250)).toMatchObject({
      steps: ['I'],
      matchedStepCount: 1,
    })

    const tieOnRecency = [
      makeSequence({
        id: 'shorter',
        sequence: ['G', 'H'],
        matchedStepCount: 1,
        partialMatchLastKeyTime: 4_500,
      }),
      makeSequence({
        id: 'more-advanced',
        sequence: ['G', 'T', 'X'],
        matchedStepCount: 2,
        partialMatchLastKeyTime: 4_500,
      }),
    ]

    expect(getVisibleShortcutChord(tieOnRecency, 4_700)).toMatchObject({
      steps: ['G', 'T'],
      matchedStepCount: 2,
    })
  })
})
