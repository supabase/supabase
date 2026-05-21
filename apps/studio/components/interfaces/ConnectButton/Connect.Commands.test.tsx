import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { useConnectCommands } from './Connect.Commands'
import { PROJECT_STATUS } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

const {
  mockSetCommandMenuOpen,
  mockSetConnectSheetSource,
  mockSetConnectTab,
  mockSetShowConnect,
  mockUseRegisterCommands,
  mockUseSelectedProjectQuery,
  mockUseShortcut,
} = vi.hoisted(() => ({
  mockSetCommandMenuOpen: vi.fn(),
  mockSetConnectSheetSource: vi.fn(),
  mockSetConnectTab: vi.fn(),
  mockSetShowConnect: vi.fn(),
  mockUseRegisterCommands: vi.fn(),
  mockUseSelectedProjectQuery: vi.fn(),
  mockUseShortcut: vi.fn(),
}))

vi.mock('ui-patterns/CommandMenu', () => ({
  useRegisterCommands: mockUseRegisterCommands,
  useSetCommandMenuOpen: () => mockSetCommandMenuOpen,
}))

vi.mock('nuqs', () => ({
  parseAsBoolean: { withDefault: vi.fn(() => 'showConnectParser') },
  parseAsString: 'stringParser',
  useQueryState: (key: string) => {
    if (key === 'showConnect') return [false, mockSetShowConnect]
    if (key === 'connectTab') return [null, mockSetConnectTab]
    return [null, vi.fn()]
  },
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

describe('useConnectCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { status: PROJECT_STATUS.ACTIVE_HEALTHY },
    })
  })

  it('registers the Connect sheet shortcut when the selected project can connect', () => {
    renderHook(() => useConnectCommands())

    expect(mockUseShortcut).toHaveBeenCalledWith(
      SHORTCUT_IDS.CONNECT_OPEN_SHEET,
      expect.any(Function),
      { enabled: true }
    )
  })

  it('opens the Connect sheet from the keyboard shortcut', () => {
    renderHook(() => useConnectCommands())

    const shortcutCallback = mockUseShortcut.mock.calls[0][1]
    shortcutCallback()

    expect(mockSetConnectSheetSource).toHaveBeenCalledWith('keyboard_shortcut')
    expect(mockSetShowConnect).toHaveBeenCalledWith(true)
    expect(mockSetCommandMenuOpen).toHaveBeenCalledWith(false)
  })

  it('shows the shortcut badge on the Connect command', () => {
    renderHook(() => useConnectCommands())

    const [, commands, options] = mockUseRegisterCommands.mock.calls[0]

    expect(options.enabled).toBe(true)
    expect(commands[0]).toMatchObject({
      id: 'connect-to-project',
      name: 'Connect to your project',
    })
    expect(commands[0].badge).toBeTypeOf('function')
  })

  it('disables the shortcut and commands when the selected project cannot connect', () => {
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { status: PROJECT_STATUS.INACTIVE },
    })

    renderHook(() => useConnectCommands())

    expect(mockUseShortcut).toHaveBeenCalledWith(
      SHORTCUT_IDS.CONNECT_OPEN_SHEET,
      expect.any(Function),
      { enabled: false }
    )
    expect(mockUseRegisterCommands.mock.calls[0][2].enabled).toBe(false)
  })
})
