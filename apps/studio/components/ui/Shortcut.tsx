import { TooltipContentProps } from '@ui/components/shadcn/ui/tooltip'
import type { ReactNode } from 'react'

import { ShortcutTooltip } from './ShortcutTooltip'
import type { ShortcutId } from '@/state/shortcuts/registry'
import type { ShortcutOptions } from '@/state/shortcuts/types'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface ShortcutProps {
  /** Registered shortcut id — drives both the hotkey binding and the tooltip. */
  id: ShortcutId
  /** Fires on the hotkey. Usually the same handler wired to the child's `onClick`. */
  onTrigger: () => void
  /** Element to bind the shortcut to and wrap in the tooltip. */
  children: ReactNode
  /** Per-mount overrides for the shortcut — see `ShortcutOptions`. */
  options?: ShortcutOptions
  side?: TooltipContentProps['side']
  align?: TooltipContentProps['align']
  sideOffset?: number
  delayDuration?: number
  /**
   * Override the label from the registry. Use when the wrapped element's
   * action is a narrower/contextual variant of the registered shortcut.
   */
  label?: string
  /**
   * Controlled open state for the tooltip. Pass `false` to force the tooltip
   * closed (e.g. while a popover or dialog opened by the wrapped element is
   * visible). Leave `undefined` for default uncontrolled behavior.
   */
  tooltipOpen?: boolean
}

/**
 * Bind a registered shortcut to an element AND show its keybind on hover,
 * Linear-style. Single source of truth: one `id` drives both the hotkey
 * listener and the tooltip, so they can't drift.
 *
 * The wrapped child stays fully interactive — Radix `asChild` passes clicks,
 * focus, and refs through untouched.
 *
 * @example
 * <Shortcut id={SHORTCUT_IDS.RESULTS_COPY_MARKDOWN} onTrigger={handleCopy}>
 *   <Button onClick={handleCopy}>Copy</Button>
 * </Shortcut>
 *
 * @example
 * // Gate the hotkey on local state; tooltip still renders:
 * <Shortcut
 *   id={SHORTCUT_IDS.ACTION_BAR_SAVE}
 *   onTrigger={handleSave}
 *   options={{ enabled: hasUnsavedChanges }}
 * >
 *   <Button onClick={handleSave} disabled={!hasUnsavedChanges}>Save</Button>
 * </Shortcut>
 */
export const Shortcut = ({
  id,
  onTrigger,
  children,
  options,
  side,
  align,
  sideOffset,
  delayDuration,
  label,
  tooltipOpen,
}: ShortcutProps) => {
  useShortcut(id, onTrigger, options)

  return (
    <ShortcutTooltip
      shortcutId={id}
      side={side}
      align={align}
      sideOffset={sideOffset}
      delayDuration={delayDuration}
      label={label}
      open={tooltipOpen}
    >
      {children}
    </ShortcutTooltip>
  )
}
