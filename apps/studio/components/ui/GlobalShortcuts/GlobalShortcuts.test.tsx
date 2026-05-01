import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GlobalShortcuts } from './GlobalShortcuts'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

const { mockSetCommandMenuOpen, mockUseShortcut, mockUseIsShortcutChordHudEnabled } = vi.hoisted(
  () => ({
    mockSetCommandMenuOpen: vi.fn(),
    mockUseShortcut: vi.fn(),
    mockUseIsShortcutChordHudEnabled: vi.fn(() => true),
  })
)

vi.mock('ui-patterns/CommandMenu', () => ({
  useSetCommandMenuOpen: () => mockSetCommandMenuOpen,
}))

vi.mock('@/state/shortcuts/useShortcut', () => ({
  useShortcut: mockUseShortcut,
}))

vi.mock('@/components/interfaces/Account/Preferences/useDashboardSettings', () => ({
  useIsShortcutChordHudEnabled: mockUseIsShortcutChordHudEnabled,
}))

vi.mock('./ShortcutsReferenceSheet', () => ({
  ShortcutsReferenceSheet: ({ open }: { open: boolean }) => (
    <div data-testid="shortcuts-reference-sheet" data-open={open} />
  ),
}))

vi.mock('./ShortcutChordHud', () => ({
  ShortcutChordHud: () => <div data-testid="shortcut-chord-hud" />,
}))

describe('GlobalShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsShortcutChordHudEnabled.mockReturnValue(true)
  })

  it('registers the shortcuts reference action in the command palette', () => {
    render(<GlobalShortcuts />)

    expect(mockUseShortcut).toHaveBeenCalledWith(
      SHORTCUT_IDS.SHORTCUTS_OPEN_REFERENCE,
      expect.any(Function),
      { registerInCommandMenu: true }
    )
  })

  it('closes the command palette and opens the shortcuts reference sheet', () => {
    render(<GlobalShortcuts />)

    const openReference = mockUseShortcut.mock.calls[0][1]
    act(() => openReference())

    expect(mockSetCommandMenuOpen).toHaveBeenCalledWith(false)
    expect(screen.getByTestId('shortcuts-reference-sheet')).toHaveAttribute('data-open', 'true')
  })

  it('renders the chord HUD when the preference is enabled', () => {
    render(<GlobalShortcuts />)

    expect(screen.getByTestId('shortcut-chord-hud')).toBeInTheDocument()
  })

  it('does not mount the chord HUD when the preference is disabled', () => {
    mockUseIsShortcutChordHudEnabled.mockReturnValue(false)

    render(<GlobalShortcuts />)

    expect(screen.queryByTestId('shortcut-chord-hud')).not.toBeInTheDocument()
  })
})
