import { getSequenceManager } from '@tanstack/react-hotkeys'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { eventMatchesAnyShortcut } from './matchEvent'
import type { RegistryDefinations } from './types'

vi.mock('@tanstack/react-hotkeys', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-hotkeys')>('@tanstack/react-hotkeys')
  return {
    ...actual,
    getSequenceManager: vi.fn(),
  }
})

type FakeRegistration = {
  options: { enabled?: boolean }
  sequence: string[]
}

/** Swap the SequenceManager's registrations for the ones we care about. */
function withRegistrations(registrations: FakeRegistration[]) {
  const state = new Map(registrations.map((r, i) => [String(i), r]))
  vi.mocked(getSequenceManager).mockReturnValue({
    registrations: { state },
  } as unknown as ReturnType<typeof getSequenceManager>)
}

const shiftX = new KeyboardEvent('keydown', {
  key: 'X',
  code: 'KeyX',
  shiftKey: true,
})

const arrowDown = new KeyboardEvent('keydown', {
  key: 'ArrowDown',
  code: 'ArrowDown',
})

const g = new KeyboardEvent('keydown', {
  key: 'g',
  code: 'KeyG',
})

const shiftK = new KeyboardEvent('keydown', {
  key: 'K',
  code: 'KeyK',
  shiftKey: true,
})

const registry: RegistryDefinations<string> = {
  'table.shift-x': {
    id: 'table.shift-x',
    label: 'Toggle row',
    sequence: ['Shift+X'],
  },
  'table.arrow-down': {
    id: 'table.arrow-down',
    label: 'Start navigation (down)',
    sequence: ['ArrowDown'],
  },
  'table.chord': {
    id: 'table.chord',
    label: 'Chord',
    sequence: ['G', 'T'],
  },
}

describe('eventMatchesAnyShortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false when there are no active registrations', () => {
    withRegistrations([])
    expect(eventMatchesAnyShortcut(shiftX, registry)).toBe(false)
  })

  it('returns true when an active, enabled shortcut in scope matches', () => {
    withRegistrations([{ options: {}, sequence: ['Shift+X'] }])
    expect(eventMatchesAnyShortcut(shiftX, registry)).toBe(true)
  })

  it('returns false when the matching shortcut is disabled', () => {
    withRegistrations([{ options: { enabled: false }, sequence: ['ArrowDown'] }])
    expect(eventMatchesAnyShortcut(arrowDown, registry)).toBe(false)
  })

  it('treats enabled: undefined and enabled: true as enabled', () => {
    withRegistrations([
      { options: {}, sequence: ['Shift+X'] },
      { options: { enabled: true }, sequence: ['ArrowDown'] },
    ])
    expect(eventMatchesAnyShortcut(arrowDown, registry)).toBe(true)
  })

  it('returns false when the matching registration is not in the target registry', () => {
    // 'Shift+K' is registered and matches the event, but our scoped registry
    // doesn't include it — so we should not claim a match.
    withRegistrations([{ options: {}, sequence: ['Shift+K'] }])
    expect(eventMatchesAnyShortcut(shiftK, registry)).toBe(false)
  })

  it('matches any individual step of a chord sequence', () => {
    withRegistrations([{ options: {}, sequence: ['G', 'T'] }])
    expect(eventMatchesAnyShortcut(g, registry)).toBe(true)
  })

  it('returns true if any enabled duplicate matches, even when a disabled one is also present', () => {
    withRegistrations([
      { options: { enabled: false }, sequence: ['Shift+X'] },
      { options: {}, sequence: ['Shift+X'] },
    ])
    expect(eventMatchesAnyShortcut(shiftX, registry)).toBe(true)
  })

  it('returns false when no active sequence matches the event', () => {
    withRegistrations([{ options: {}, sequence: ['Shift+X'] }])
    expect(eventMatchesAnyShortcut(arrowDown, registry)).toBe(false)
  })
})
