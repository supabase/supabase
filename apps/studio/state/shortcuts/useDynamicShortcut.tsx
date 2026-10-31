import { useHotkeySequence, type HotkeySequence } from '@tanstack/react-hotkeys'
import { Fragment, useCallback, useMemo } from 'react'
import { KeyboardShortcut } from 'ui'
import { useRegisterCommands, useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'

import { hotkeyToKeys } from './formatShortcut'
import type { ShortcutHotkeyMeta, ShortcutOptions } from './types'
import { orderShortcutCommands } from './utils'
import { COMMAND_MENU_SECTIONS } from '@/components/interfaces/App/CommandMenu/CommandMenu.utils'
import { useLatest } from '@/hooks/misc/useLatest'

/**
 * Props shared by both the hook and the `<DynamicShortcut>` component.
 *
 * "Dynamic" means the shortcut isn't pre-declared in `SHORTCUT_DEFINITIONS` —
 * the call site provides the `id`, `sequence`, and `label` at mount time.
 * Use this when the shortcut list itself is derived from data (e.g. a tab list
 * whose count and labels vary per page).
 *
 * Behavior matches `useShortcut` for the surfaces a dynamic shortcut can
 * meaningfully participate in:
 *   - Reference sheet — picks these up via the `meta` payload while mounted.
 *   - Cmd+K command menu — opt-in via `registerInCommandMenu`, same pattern
 *     and ordering as registered shortcuts.
 *
 * What it does *not* support, because both are keyed on static `ShortcutId`s:
 *   - User-preference toggle in Account → Preferences.
 *   - `showInSettings` rendering in the keyboard shortcuts settings page.
 *
 * `id` must be unique among currently-mounted shortcuts. TanStack's hotkey
 * lib warns by default when two registrations share a `sequence`, so prefer
 * scoping IDs by surface (e.g. `integration-detail.tab-${index}`).
 */
export interface DynamicShortcutProps {
  id: string
  sequence: HotkeySequence
  label: string
  callback: () => void
  enabled?: boolean
  referenceGroup?: string
  registerInCommandMenu?: boolean
  ignoreInputs?: ShortcutOptions['ignoreInputs']
  timeout?: ShortcutOptions['timeout']
  conflictBehavior?: ShortcutOptions['conflictBehavior']
}

export function useDynamicShortcut({
  id,
  sequence,
  label,
  callback,
  enabled = true,
  referenceGroup,
  registerInCommandMenu = false,
  ignoreInputs,
  timeout,
  conflictBehavior,
}: DynamicShortcutProps) {
  const meta = useMemo<ShortcutHotkeyMeta>(
    () => ({ id, name: label, referenceGroup }),
    [id, label, referenceGroup]
  )

  useHotkeySequence(sequence, callback, {
    enabled,
    timeout,
    meta,
    ...(ignoreInputs !== undefined && { ignoreInputs }),
    ...(conflictBehavior !== undefined && { conflictBehavior }),
  })

  const enabledInCommandMenu = enabled && registerInCommandMenu
  const callbackRef = useLatest(callback)
  const setCommandMenuOpen = useSetCommandMenuOpen()
  const stableAction = useCallback(() => {
    setCommandMenuOpen(false)
    callbackRef.current()
  }, [callbackRef, setCommandMenuOpen])

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.SHORTCUTS,
    [
      {
        id,
        name: label,
        action: stableAction,
        badge: () => (
          <div className="flex items-center gap-1">
            {sequence.map((step, i) => (
              <Fragment key={i}>
                {i > 0 && <span className="text-foreground-lighter text-[11px]">then</span>}
                <KeyboardShortcut keys={hotkeyToKeys(step)} />
              </Fragment>
            ))}
          </div>
        ),
      },
    ],
    {
      enabled: enabledInCommandMenu,
      deps: [enabled, label, sequence.join('+')],
      orderCommands: orderShortcutCommands,
      sectionMeta: { priority: 1 },
    }
  )
}

/**
 * Renderable wrapper around `useDynamicShortcut`. Lets callers compose
 * shortcuts inside a `.map()` over dynamic data without violating rules-of-hooks:
 *
 * ```tsx
 * {tabs.map((tab, i) => (
 *   <DynamicShortcut
 *     key={tab.href}
 *     id={`integration-detail.tab-${i}`}
 *     sequence={[String(i + 1)]}
 *     label={`Go to ${tab.label}`}
 *     registerInCommandMenu
 *     callback={() => router.push(tab.href)}
 *   />
 * ))}
 * ```
 */
export function DynamicShortcut(props: DynamicShortcutProps) {
  useDynamicShortcut(props)
  return null
}
