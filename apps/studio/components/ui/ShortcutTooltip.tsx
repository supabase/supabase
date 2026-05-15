import { TooltipContentProps } from '@ui/components/shadcn/ui/tooltip'
import { Fragment, type ReactNode } from 'react'
import { KeyboardShortcut, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { hotkeyToKeys } from '@/state/shortcuts/formatShortcut'
import { SHORTCUT_DEFINITIONS, type ShortcutId } from '@/state/shortcuts/registry'

interface ShortcutTooltipProps {
  shortcutId: ShortcutId
  children: ReactNode
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
  open?: boolean
}

/**
 * Wraps any element to show its bound keyboard shortcut on hover/focus, in the
 * style of Linear's shortcut tooltips: `"<label>   <key> [then <key>]"`.
 *
 * Uses Radix's `asChild` trigger, so the wrapped element remains fully
 * interactive — clicks, focus, and event handlers pass through untouched.
 *
 * @example
 * <ShortcutTooltip shortcutId={SHORTCUT_IDS.RESULTS_COPY_MARKDOWN}>
 *   <Button onClick={handleCopy}>Copy</Button>
 * </ShortcutTooltip>
 */
export const ShortcutTooltip = ({
  shortcutId,
  children,
  side,
  align,
  sideOffset,
  delayDuration,
  label: labelOverride,
  open,
}: ShortcutTooltipProps) => {
  const def = SHORTCUT_DEFINITIONS[shortcutId]
  const label = labelOverride ?? def.label

  return (
    <Tooltip delayDuration={delayDuration} open={open}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="flex items-center gap-2"
      >
        <span>{label}</span>
        <span className="flex items-center gap-1">
          {def.sequence.map((step, i) => (
            <Fragment key={i}>
              {i > 0 && <span className="text-foreground-lighter text-[11px]">then</span>}
              <KeyboardShortcut keys={hotkeyToKeys(step)} />
            </Fragment>
          ))}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}
