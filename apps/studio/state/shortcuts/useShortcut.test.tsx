import { render, renderHook } from '@testing-library/react'
import type { ICommand } from 'ui-patterns/CommandMenu/api/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SHORTCUT_DEFINITIONS, SHORTCUT_IDS } from './registry'
import { useShortcut } from './useShortcut'

const {
  mockUseHotkeySequence,
  mockUseRegisterCommands,
  mockUseIsShortcutEnabled,
  mockSetCommandMenuOpen,
} = vi.hoisted(() => ({
  mockUseHotkeySequence: vi.fn(),
  mockUseRegisterCommands: vi.fn(),
  mockUseIsShortcutEnabled: vi.fn(),
  mockSetCommandMenuOpen: vi.fn(),
}))

vi.mock('@tanstack/react-hotkeys', () => ({
  useHotkeySequence: mockUseHotkeySequence,
}))

vi.mock('ui-patterns/CommandMenu', () => ({
  useRegisterCommands: mockUseRegisterCommands,
  useSetCommandMenuOpen: () => mockSetCommandMenuOpen,
}))

vi.mock('./useIsShortcutEnabled', () => ({
  useIsShortcutEnabled: mockUseIsShortcutEnabled,
}))

const getLastHotkeyOptions = () => {
  const call = mockUseHotkeySequence.mock.calls.at(-1)
  if (!call) throw new Error('useHotkeySequence was not called')
  return call[2] as { enabled: boolean; timeout: number | undefined; ignoreInputs?: boolean }
}

const getLastRegisterCall = () => {
  const call = mockUseRegisterCommands.mock.calls.at(-1)
  if (!call) throw new Error('useRegisterCommands was not called')
  return call as [
    string,
    Array<{ id: string; name: string; action: () => void; badge: () => any }>,
    { enabled: boolean; deps: unknown[]; orderCommands?: unknown },
  ]
}

describe('useShortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsShortcutEnabled.mockReturnValue(true)
  })

  describe('hotkey wiring', () => {
    it('passes the registry sequence to useHotkeySequence', () => {
      const cb = vi.fn()
      renderHook(() => useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, cb))

      const [sequence, callback] = mockUseHotkeySequence.mock.calls[0]
      expect(sequence).toEqual(SHORTCUT_DEFINITIONS[SHORTCUT_IDS.COMMAND_MENU_OPEN].sequence)
      expect(callback).toBe(cb)
    })

    it('passes multi-step sequences (G-chords) through unchanged', () => {
      renderHook(() => useShortcut(SHORTCUT_IDS.NAV_HOME, vi.fn()))
      expect(mockUseHotkeySequence.mock.calls[0][0]).toEqual(['G', 'H'])
    })

    it('wires the callback by reference — useHotkeySequence receives the same function', () => {
      const cb = vi.fn()
      renderHook(() => useShortcut(SHORTCUT_IDS.ACTION_BAR_SAVE, cb))
      const passedCallback = mockUseHotkeySequence.mock.calls[0][1]
      passedCallback()
      expect(cb).toHaveBeenCalledTimes(1)
    })
  })

  describe('enabled resolution', () => {
    it('defaults to enabled: true when no options and no registry default', () => {
      renderHook(() => useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, vi.fn()))
      expect(getLastHotkeyOptions().enabled).toBe(true)
    })

    it('caller option takes priority over fallback', () => {
      renderHook(() => useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, vi.fn(), { enabled: false }))
      expect(getLastHotkeyOptions().enabled).toBe(false)
    })

    it('global disable forces enabled to false, regardless of caller', () => {
      mockUseIsShortcutEnabled.mockReturnValue(false)
      renderHook(() => useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, vi.fn(), { enabled: true }))
      expect(getLastHotkeyOptions().enabled).toBe(false)
    })

    it('global enabled AND caller enabled = true', () => {
      mockUseIsShortcutEnabled.mockReturnValue(true)
      renderHook(() => useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, vi.fn(), { enabled: true }))
      expect(getLastHotkeyOptions().enabled).toBe(true)
    })

    it('global enabled AND caller undefined = true', () => {
      mockUseIsShortcutEnabled.mockReturnValue(true)
      renderHook(() => useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, vi.fn()))
      expect(getLastHotkeyOptions().enabled).toBe(true)
    })

    it('subscribes to the correct shortcut id for global preference', () => {
      renderHook(() => useShortcut(SHORTCUT_IDS.NAV_TABLE_EDITOR, vi.fn()))
      expect(mockUseIsShortcutEnabled).toHaveBeenCalledWith(SHORTCUT_IDS.NAV_TABLE_EDITOR)
    })
  })

  describe('timeout resolution', () => {
    it('defaults to undefined (falls through to TanStack default)', () => {
      renderHook(() => useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, vi.fn()))
      expect(getLastHotkeyOptions().timeout).toBeUndefined()
    })

    it('uses caller-provided timeout', () => {
      renderHook(() => useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, vi.fn(), { timeout: 2000 }))
      expect(getLastHotkeyOptions().timeout).toBe(2000)
    })
  })

  describe('ignoreInputs resolution', () => {
    it('omits the key when no registry default and no caller override (library applies its per-hotkey default)', () => {
      renderHook(() => useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, vi.fn()))
      const options = getLastHotkeyOptions()
      expect('ignoreInputs' in options).toBe(false)
    })

    it('uses the registry default when no caller override', () => {
      renderHook(() => useShortcut(SHORTCUT_IDS.TABLE_EDITOR_JUMP_FIRST_ROW, vi.fn()))
      expect(getLastHotkeyOptions().ignoreInputs).toBe(true)
    })

    it('caller override takes priority over registry default', () => {
      renderHook(() =>
        useShortcut(SHORTCUT_IDS.TABLE_EDITOR_JUMP_FIRST_ROW, vi.fn(), { ignoreInputs: false })
      )
      expect(getLastHotkeyOptions().ignoreInputs).toBe(false)
    })
  })

  describe('command menu registration', () => {
    it('calls useRegisterCommands under the "Shortcuts" section', () => {
      renderHook(() => useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, vi.fn()))
      const [section] = getLastRegisterCall()
      expect(section).toBe('Shortcuts')
    })

    it('is disabled by default (registerInCommandMenu defaults to false)', () => {
      renderHook(() => useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, vi.fn()))
      expect(getLastRegisterCall()[2].enabled).toBe(false)
    })

    it('is enabled when registerInCommandMenu: true AND enabled', () => {
      renderHook(() =>
        useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, vi.fn(), { registerInCommandMenu: true })
      )
      expect(getLastRegisterCall()[2].enabled).toBe(true)
    })

    it('is disabled when globally disabled, even with registerInCommandMenu: true', () => {
      mockUseIsShortcutEnabled.mockReturnValue(false)
      renderHook(() =>
        useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, vi.fn(), { registerInCommandMenu: true })
      )
      expect(getLastRegisterCall()[2].enabled).toBe(false)
    })

    it('is disabled when caller passes enabled: false, even with registerInCommandMenu: true', () => {
      renderHook(() =>
        useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, vi.fn(), {
          enabled: false,
          registerInCommandMenu: true,
        })
      )
      expect(getLastRegisterCall()[2].enabled).toBe(false)
    })

    it('registers the command with id and label from the registry', () => {
      renderHook(() =>
        useShortcut(SHORTCUT_IDS.RESULTS_COPY_MARKDOWN, vi.fn(), { registerInCommandMenu: true })
      )
      const [, commands] = getLastRegisterCall()
      expect(commands).toHaveLength(1)
      expect(commands[0].id).toBe(SHORTCUT_IDS.RESULTS_COPY_MARKDOWN)
      expect(commands[0].name).toBe(SHORTCUT_DEFINITIONS[SHORTCUT_IDS.RESULTS_COPY_MARKDOWN].label)
    })

    it('command action calls the LATEST callback after a rerender (no stale closure)', () => {
      const cb1 = vi.fn()
      const cb2 = vi.fn()
      const { rerender } = renderHook(
        ({ cb }: { cb: () => void }) =>
          useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, cb, { registerInCommandMenu: true }),
        { initialProps: { cb: cb1 } }
      )

      // Capture the action from the first render and fire it after a rerender —
      // it should call the NEW callback, proving we dodge the stale closure.
      const firstAction = mockUseRegisterCommands.mock.calls[0][1][0].action

      rerender({ cb: cb2 })

      firstAction()
      expect(cb1).not.toHaveBeenCalled()
      expect(cb2).toHaveBeenCalledTimes(1)
    })

    it('command action closes the command menu when fired', () => {
      const cb = vi.fn()
      renderHook(() =>
        useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, cb, { registerInCommandMenu: true })
      )
      const action = mockUseRegisterCommands.mock.calls[0][1][0].action

      action()

      expect(mockSetCommandMenuOpen).toHaveBeenCalledWith(false)
      expect(cb).toHaveBeenCalledTimes(1)
    })

    it('command action identity is stable across renders', () => {
      const { rerender } = renderHook(
        ({ cb }: { cb: () => void }) =>
          useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, cb, { registerInCommandMenu: true }),
        { initialProps: { cb: vi.fn() } }
      )
      const firstAction = mockUseRegisterCommands.mock.calls[0][1][0].action

      rerender({ cb: vi.fn() })
      const secondAction = mockUseRegisterCommands.mock.calls.at(-1)![1][0].action

      expect(firstAction).toBe(secondAction)
    })

    it('deps track enabled + label so downstream can invalidate correctly', () => {
      renderHook(() =>
        useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, vi.fn(), { registerInCommandMenu: true })
      )
      const [, , options] = getLastRegisterCall()
      expect(options.deps).toEqual([
        true,
        SHORTCUT_DEFINITIONS[SHORTCUT_IDS.COMMAND_MENU_OPEN].label,
      ])
    })

    it('orders "Show all keyboard shortcuts" last within the Shortcuts section', () => {
      renderHook(() =>
        useShortcut(SHORTCUT_IDS.SHORTCUTS_OPEN_REFERENCE, vi.fn(), { registerInCommandMenu: true })
      )

      const [, commands, options] = getLastRegisterCall()
      const orderCommands = options.orderCommands as (
        existing: ICommand[],
        commandsToInsert: ICommand[]
      ) => ICommand[]

      const ordered = orderCommands(
        [
          { id: SHORTCUT_IDS.TABLE_EDITOR_INSERT_ROW, name: 'Insert row', action: vi.fn() },
          { id: SHORTCUT_IDS.TABLE_EDITOR_INSERT_COLUMN, name: 'Insert column', action: vi.fn() },
        ],
        commands
      )

      expect(ordered.map((command) => command.id)).toEqual([
        SHORTCUT_IDS.TABLE_EDITOR_INSERT_ROW,
        SHORTCUT_IDS.TABLE_EDITOR_INSERT_COLUMN,
        SHORTCUT_IDS.SHORTCUTS_OPEN_REFERENCE,
      ])
    })

    describe('badge rendering', () => {
      it('renders a single KeyboardShortcut pill for single-step sequences (no "then")', () => {
        renderHook(() =>
          useShortcut(SHORTCUT_IDS.COMMAND_MENU_OPEN, vi.fn(), { registerInCommandMenu: true })
        )
        const badgeNode = getLastRegisterCall()[1][0].badge()
        const { container } = render(badgeNode)
        expect(container.textContent).not.toContain('then')
      })

      it('renders a "then" separator between steps for multi-step sequences', () => {
        renderHook(() =>
          useShortcut(SHORTCUT_IDS.NAV_HOME, vi.fn(), { registerInCommandMenu: true })
        )
        const badgeNode = getLastRegisterCall()[1][0].badge()
        const { container } = render(badgeNode)
        expect(container.textContent).toContain('then')
      })

      it('renders the converted keys (Mod → ⌘ or Ctrl via KeyboardShortcut)', () => {
        renderHook(() =>
          useShortcut(SHORTCUT_IDS.RESULTS_COPY_MARKDOWN, vi.fn(), {
            registerInCommandMenu: true,
          })
        )
        const badgeNode = getLastRegisterCall()[1][0].badge()
        const { container } = render(badgeNode)
        // Mod+Shift+M → the "M" key is always rendered as-is; the platform-specific
        // ⌘/Ctrl handling lives in KeyboardShortcut and is asserted there.
        expect(container.textContent).toContain('M')
        expect(container.textContent).toContain('⇧')
      })
    })
  })
})
