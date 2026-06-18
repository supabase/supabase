import { Fragment } from 'react'
import { cn, KeyboardShortcut } from 'ui'

import { hotkeyToKeys } from '@/state/shortcuts/formatShortcut'
import { SHORTCUT_DEFINITIONS, type ShortcutId } from '@/state/shortcuts/registry'

interface ShortcutBadgeProps {
  shortcutId: ShortcutId
  className?: string
  /** `'inline'` (default) is flat text; `'pill'` is a boxed badge. */
  variant?: 'inline' | 'pill'
}

/**
 * Inline display of the keybind for a registered shortcut. Useful inside
 * menu items, buttons, or rows where the label already exists elsewhere and
 * you just want to surface the keybind itself (no tooltip / hover).
 *
 * For multi-step sequences (e.g. `['G', 'T']`), each step is separated by the
 * word "then".
 *
 * @example
 * <DropdownMenuItem>
 *   <p>Copy as CSV</p>
 *   <ShortcutBadge shortcutId={SHORTCUT_IDS.RESULTS_COPY_CSV} className="ml-auto" />
 * </DropdownMenuItem>
 */
export const ShortcutBadge = ({
  shortcutId,
  className,
  variant = 'inline',
}: ShortcutBadgeProps) => {
  const def = SHORTCUT_DEFINITIONS[shortcutId]

  return (
    <span className={cn('flex items-center gap-1', className)}>
      {def.sequence.map((step, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-foreground-lighter text-[11px]">then</span>}
          <KeyboardShortcut keys={hotkeyToKeys(step)} variant={variant} />
        </Fragment>
      ))}
    </span>
  )
}
