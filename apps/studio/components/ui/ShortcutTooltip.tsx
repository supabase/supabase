import { TooltipContentProps } from '@ui/components/shadcn/ui/tooltip'
import { Fragment, useState, type ReactNode } from 'react'
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
   * Override the tooltip's open state. Pass `false` to force the tooltip closed
   * (e.g. while a popover or dialog opened by the wrapped element is visible).
   * Leave `undefined` to let hover/focus drive it. The tooltip is always
   * controlled internally so toggling this prop won't trigger Radix's
   * controlled/uncontrolled warning.
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

  const [hoverOpen, setHoverOpen] = useState(false)
  const resolvedOpen = open ?? hoverOpen

  return (
    <Tooltip delayDuration={delayDuration} open={resolvedOpen} onOpenChange={setHoverOpen}>
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
