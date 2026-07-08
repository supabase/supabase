import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Shortcut } from './Shortcut'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

const { mockUseShortcut, mockShortcutTooltip } = vi.hoisted(() => ({
  mockUseShortcut: vi.fn(),
  mockShortcutTooltip: vi.fn((props: any) => (
    <div data-testid="shortcut-tooltip">{props.children}</div>
  )),
}))

vi.mock('@/state/shortcuts/useShortcut', () => ({
  useShortcut: mockUseShortcut,
}))

vi.mock('./ShortcutTooltip', () => ({
  ShortcutTooltip: mockShortcutTooltip,
}))

describe('Shortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the wrapped child', () => {
      render(
        <Shortcut id={SHORTCUT_IDS.COMMAND_MENU_OPEN} onTrigger={() => {}}>
          <button>Open</button>
        </Shortcut>
      )
      expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
    })

    it('wraps the child in ShortcutTooltip', () => {
      render(
        <Shortcut id={SHORTCUT_IDS.COMMAND_MENU_OPEN} onTrigger={() => {}}>
          <button>Open</button>
        </Shortcut>
      )
      const tooltip = screen.getByTestId('shortcut-tooltip')
      expect(tooltip).toContainElement(screen.getByRole('button', { name: 'Open' }))
    })
  })

  describe('useShortcut wiring', () => {
    it('forwards id and onTrigger to useShortcut', () => {
      const handler = vi.fn()
      render(
        <Shortcut id={SHORTCUT_IDS.ACTION_BAR_SAVE} onTrigger={handler}>
          <button>Save</button>
        </Shortcut>
      )
      expect(mockUseShortcut).toHaveBeenCalledWith(SHORTCUT_IDS.ACTION_BAR_SAVE, handler, undefined)
    })

    it('forwards options to useShortcut', () => {
      const handler = vi.fn()
      const options = { enabled: true, registerInCommandMenu: true }
      render(
        <Shortcut id={SHORTCUT_IDS.ACTION_BAR_SAVE} onTrigger={handler} options={options}>
          <button>Save</button>
        </Shortcut>
      )
      expect(mockUseShortcut).toHaveBeenCalledWith(SHORTCUT_IDS.ACTION_BAR_SAVE, handler, options)
    })

    it('passes updated options to useShortcut on rerender', () => {
      const handler = vi.fn()
      const { rerender } = render(
        <Shortcut
          id={SHORTCUT_IDS.ACTION_BAR_SAVE}
          onTrigger={handler}
          options={{ enabled: false }}
        >
          <button>Save</button>
        </Shortcut>
      )
      expect(mockUseShortcut).toHaveBeenLastCalledWith(SHORTCUT_IDS.ACTION_BAR_SAVE, handler, {
        enabled: false,
      })

      rerender(
        <Shortcut id={SHORTCUT_IDS.ACTION_BAR_SAVE} onTrigger={handler} options={{ enabled: true }}>
          <button>Save</button>
        </Shortcut>
      )
      expect(mockUseShortcut).toHaveBeenLastCalledWith(SHORTCUT_IDS.ACTION_BAR_SAVE, handler, {
        enabled: true,
      })
    })

    it('passes updated id to useShortcut on rerender', () => {
      const handler = vi.fn()
      const { rerender } = render(
        <Shortcut id={SHORTCUT_IDS.NAV_HOME} onTrigger={handler}>
          <button>Go</button>
        </Shortcut>
      )
      expect(mockUseShortcut).toHaveBeenLastCalledWith(SHORTCUT_IDS.NAV_HOME, handler, undefined)

      rerender(
        <Shortcut id={SHORTCUT_IDS.NAV_TABLE_EDITOR} onTrigger={handler}>
          <button>Go</button>
        </Shortcut>
      )
      expect(mockUseShortcut).toHaveBeenLastCalledWith(
        SHORTCUT_IDS.NAV_TABLE_EDITOR,
        handler,
        undefined
      )
    })
  })

  describe('ShortcutTooltip wiring', () => {
    it('forwards shortcutId to ShortcutTooltip', () => {
      render(
        <Shortcut id={SHORTCUT_IDS.NAV_HOME} onTrigger={() => {}}>
          <button>Home</button>
        </Shortcut>
      )
      expect(mockShortcutTooltip).toHaveBeenCalled()
      expect(mockShortcutTooltip.mock.calls.at(-1)![0].shortcutId).toBe(SHORTCUT_IDS.NAV_HOME)
    })

    it('forwards tooltip positioning props', () => {
      render(
        <Shortcut
          id={SHORTCUT_IDS.NAV_HOME}
          onTrigger={() => {}}
          side="right"
          align="start"
          sideOffset={8}
          delayDuration={100}
        >
          <button>Home</button>
        </Shortcut>
      )
      const props = mockShortcutTooltip.mock.calls.at(-1)![0]
      expect(props.side).toBe('right')
      expect(props.align).toBe('start')
      expect(props.sideOffset).toBe(8)
      expect(props.delayDuration).toBe(100)
    })

    it('forwards label override to ShortcutTooltip', () => {
      render(
        <Shortcut id={SHORTCUT_IDS.NAV_HOME} onTrigger={() => {}} label="Go home">
          <button>Home</button>
        </Shortcut>
      )
      expect(mockShortcutTooltip.mock.calls.at(-1)![0].label).toBe('Go home')
    })

    it('omits undefined positioning props rather than fabricating them', () => {
      render(
        <Shortcut id={SHORTCUT_IDS.NAV_HOME} onTrigger={() => {}}>
          <button>Home</button>
        </Shortcut>
      )
      const props = mockShortcutTooltip.mock.calls.at(-1)![0]
      expect(props.side).toBeUndefined()
      expect(props.align).toBeUndefined()
      expect(props.sideOffset).toBeUndefined()
      expect(props.delayDuration).toBeUndefined()
      expect(props.label).toBeUndefined()
    })
  })

  describe('child interactivity', () => {
    it('does not intercept clicks on the wrapped child', () => {
      const onClick = vi.fn()
      const onTrigger = vi.fn()
      render(
        <Shortcut id={SHORTCUT_IDS.COMMAND_MENU_OPEN} onTrigger={onTrigger}>
          <button onClick={onClick}>Open</button>
        </Shortcut>
      )

      fireEvent.click(screen.getByRole('button', { name: 'Open' }))
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onTrigger).not.toHaveBeenCalled()
    })

    it('does not invoke onTrigger during render — only the hotkey should trigger it', () => {
      const onTrigger = vi.fn()
      render(
        <Shortcut id={SHORTCUT_IDS.COMMAND_MENU_OPEN} onTrigger={onTrigger}>
          <button>Open</button>
        </Shortcut>
      )
      expect(onTrigger).not.toHaveBeenCalled()
    })
  })
})
