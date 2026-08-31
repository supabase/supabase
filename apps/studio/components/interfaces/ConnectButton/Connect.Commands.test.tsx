import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useConnectCommands } from './Connect.Commands'
import { PROJECT_STATUS } from '@/lib/constants'

const {
  mockSetCommandMenuOpen,
  mockSetConnectTab,
  mockSetShowConnect,
  mockUseRegisterCommands,
  mockUseSelectedProjectQuery,
} = vi.hoisted(() => ({
  mockSetCommandMenuOpen: vi.fn(),
  mockSetConnectTab: vi.fn(),
  mockSetShowConnect: vi.fn(),
  mockUseRegisterCommands: vi.fn(),
  mockUseSelectedProjectQuery: vi.fn(),
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

describe('useConnectCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { status: PROJECT_STATUS.ACTIVE_HEALTHY },
    })
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

  it('disables the commands when the selected project cannot connect', () => {
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { status: PROJECT_STATUS.INACTIVE },
    })

    renderHook(() => useConnectCommands())

    expect(mockUseRegisterCommands.mock.calls[0][2].enabled).toBe(false)
  })
})
