import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useConnectSheetShortcut } from './useConnectSheetShortcut'
import { PROJECT_STATUS } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

const {
  mockSetCommandMenuOpen,
  mockSetConnectSheetSource,
  mockSetShowConnect,
  mockUseSelectedProjectQuery,
  mockUseShortcut,
} = vi.hoisted(() => ({
  mockSetCommandMenuOpen: vi.fn(),
  mockSetConnectSheetSource: vi.fn(),
  mockSetShowConnect: vi.fn(),
  mockUseSelectedProjectQuery: vi.fn(),
  mockUseShortcut: vi.fn(),
}))

vi.mock('ui-patterns/CommandMenu', () => ({
  useSetCommandMenuOpen: () => mockSetCommandMenuOpen,
}))

vi.mock('nuqs', () => ({
  parseAsBoolean: { withDefault: vi.fn(() => 'showConnectParser') },
  useQueryState: () => [false, mockSetShowConnect],
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: mockUseSelectedProjectQuery,
}))

vi.mock('@/state/app-state', () => ({
  useAppStateSnapshot: () => ({ setConnectSheetSource: mockSetConnectSheetSource }),
}))

vi.mock('@/state/shortcuts/useShortcut', () => ({
  useShortcut: mockUseShortcut,
}))

describe('useConnectSheetShortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { status: PROJECT_STATUS.ACTIVE_HEALTHY },
    })
  })

  it('registers the Connect sheet shortcut when the selected project can connect', () => {
    renderHook(() => useConnectSheetShortcut())

    expect(mockUseShortcut).toHaveBeenCalledWith(
      SHORTCUT_IDS.CONNECT_OPEN_SHEET,
      expect.any(Function),
      { enabled: true }
    )
  })

  it('opens the Connect sheet from the keyboard shortcut', () => {
    renderHook(() => useConnectSheetShortcut())

    const shortcutCallback = mockUseShortcut.mock.calls[0][1]
    shortcutCallback()

    expect(mockSetConnectSheetSource).toHaveBeenCalledWith('keyboard_shortcut')
    expect(mockSetCommandMenuOpen).toHaveBeenCalledWith(false)
    expect(mockSetShowConnect).toHaveBeenCalledWith(true)
  })

  it('disables the shortcut when the selected project cannot connect', () => {
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { status: PROJECT_STATUS.INACTIVE },
    })

    renderHook(() => useConnectSheetShortcut())

    expect(mockUseShortcut).toHaveBeenCalledWith(
      SHORTCUT_IDS.CONNECT_OPEN_SHEET,
      expect.any(Function),
      { enabled: false }
    )
  })
})
