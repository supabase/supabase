import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ShortcutChordHud } from './ShortcutChordHud'
import type { ShortcutSequenceRegistration } from './ShortcutChordHud.utils'

const { mockUseHotkeyRegistrations } = vi.hoisted(() => ({
  mockUseHotkeyRegistrations: vi.fn(),
}))

vi.mock('@tanstack/react-hotkeys', () => ({
  useHotkeyRegistrations: mockUseHotkeyRegistrations,
}))

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

describe('ShortcutChordHud', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-01T10:00:00.000Z'))
    mockUseHotkeyRegistrations.mockReturnValue({ hotkeys: [], sequences: [] })
  })

  it('stays hidden when no chord is in progress', () => {
    render(<ShortcutChordHud />)

    expect(screen.queryByTestId('shortcut-chord-hud')).not.toBeInTheDocument()
  })

  it('renders the active chord at the bottom centre while a sequence is in progress', () => {
    const now = Date.now()
    mockUseHotkeyRegistrations.mockReturnValue({
      hotkeys: [],
      sequences: [
        makeSequence({
          id: 'nav.table',
          sequence: ['G', 'T'],
          matchedStepCount: 1,
          partialMatchLastKeyTime: now - 200,
        }),
      ],
    })

    render(<ShortcutChordHud />)
    act(() => {
      vi.advanceTimersByTime(20)
    })

    expect(screen.getByTestId('shortcut-chord-hud')).toBeInTheDocument()
    expect(screen.getByText('G')).toBeInTheDocument()
  })

  it('hides while focus is inside an input-like element', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    const now = Date.now()
    mockUseHotkeyRegistrations.mockReturnValue({
      hotkeys: [],
      sequences: [
        makeSequence({
          id: 'nav.table',
          sequence: ['G', 'T'],
          matchedStepCount: 1,
          partialMatchLastKeyTime: now - 200,
        }),
      ],
    })

    render(<ShortcutChordHud />)

    expect(screen.queryByTestId('shortcut-chord-hud')).not.toBeInTheDocument()

    input.remove()
  })

  it('fades the key tiles as the timeout runs down and then animates away', () => {
    const now = Date.now()
    mockUseHotkeyRegistrations.mockReturnValue({
      hotkeys: [],
      sequences: [
        makeSequence({
          id: 'nav.table',
          sequence: ['G', 'T'],
          matchedStepCount: 1,
          partialMatchLastKeyTime: now - 100,
        }),
      ],
    })

    render(<ShortcutChordHud />)
    act(() => {
      vi.advanceTimersByTime(20)
    })

    const keyTile = screen.getByTestId('shortcut-chord-hud-key-0')
    const initialOpacity = keyTile.getAttribute('style')

    act(() => {
      vi.advanceTimersByTime(700)
    })

    expect(keyTile.getAttribute('style')).not.toBe(initialOpacity)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(screen.getByTestId('shortcut-chord-hud')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(screen.queryByTestId('shortcut-chord-hud')).not.toBeInTheDocument()
  })

  it('disappears immediately once the sequence manager resets progress', () => {
    const now = Date.now()
    const sequence = makeSequence({
      id: 'nav.table',
      sequence: ['G', 'T'],
      matchedStepCount: 1,
      partialMatchLastKeyTime: now - 100,
    })

    mockUseHotkeyRegistrations.mockReturnValue({ hotkeys: [], sequences: [sequence] })

    const { rerender } = render(<ShortcutChordHud />)
    act(() => {
      vi.advanceTimersByTime(20)
    })
    expect(screen.getByTestId('shortcut-chord-hud')).toBeInTheDocument()

    mockUseHotkeyRegistrations.mockReturnValue({
      hotkeys: [],
      sequences: [{ ...sequence, matchedStepCount: 0, partialMatchLastKeyTime: 0 }],
    })

    rerender(<ShortcutChordHud />)

    expect(screen.getByTestId('shortcut-chord-hud')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(screen.queryByTestId('shortcut-chord-hud')).not.toBeInTheDocument()
  })

  it('briefly shows the full completed chord when the final key lands', () => {
    const now = Date.now()
    const sequence = makeSequence({
      id: 'nav.table',
      sequence: ['G', 'T'],
      matchedStepCount: 1,
      partialMatchLastKeyTime: now - 100,
      triggerCount: 0,
    })

    mockUseHotkeyRegistrations.mockReturnValue({ hotkeys: [], sequences: [sequence] })

    const { rerender } = render(<ShortcutChordHud />)
    act(() => {
      vi.advanceTimersByTime(20)
    })
    expect(screen.getByText('G')).toBeInTheDocument()
    expect(screen.queryByText('T')).not.toBeInTheDocument()

    mockUseHotkeyRegistrations.mockReturnValue({
      hotkeys: [],
      sequences: [
        {
          ...sequence,
          matchedStepCount: 0,
          partialMatchLastKeyTime: 0,
          triggerCount: 1,
        },
      ],
    })

    rerender(<ShortcutChordHud />)
    act(() => {
      vi.advanceTimersByTime(20)
    })

    expect(screen.getByText('G')).toBeInTheDocument()
    expect(screen.getByText('T')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(450)
    })

    expect(screen.getByTestId('shortcut-chord-hud')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(screen.queryByTestId('shortcut-chord-hud')).not.toBeInTheDocument()
  })
})
