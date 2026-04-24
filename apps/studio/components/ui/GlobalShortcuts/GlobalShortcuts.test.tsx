import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GlobalShortcuts } from './GlobalShortcuts'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

const { mockSetCommandMenuOpen, mockUseShortcut } = vi.hoisted(() => ({
  mockSetCommandMenuOpen: vi.fn(),
  mockUseShortcut: vi.fn(),
}))

vi.mock('ui-patterns/CommandMenu', () => ({
  useSetCommandMenuOpen: () => mockSetCommandMenuOpen,
}))

vi.mock('@/state/shortcuts/useShortcut', () => ({
  useShortcut: mockUseShortcut,
}))

vi.mock('./ShortcutsReferenceDialog', () => ({
  ShortcutsReferenceDialog: ({ open }: { open: boolean }) => (
    <div data-testid="shortcuts-reference-dialog" data-open={open} />
  ),
}))

describe('GlobalShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers the shortcuts reference action in the command palette', () => {
    render(<GlobalShortcuts />)

    expect(mockUseShortcut).toHaveBeenCalledWith(
      SHORTCUT_IDS.SHORTCUTS_OPEN_REFERENCE,
      expect.any(Function),
      { registerInCommandMenu: true }
    )
  })

  it('closes the command palette and opens the shortcuts reference dialog', () => {
    render(<GlobalShortcuts />)

    const openReference = mockUseShortcut.mock.calls[0][1]
    act(() => openReference())

    expect(mockSetCommandMenuOpen).toHaveBeenCalledWith(false)
    expect(screen.getByTestId('shortcuts-reference-dialog')).toHaveAttribute('data-open', 'true')
  })
})
