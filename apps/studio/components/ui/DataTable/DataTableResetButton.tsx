import { RotateCwIcon } from 'lucide-react'
import { Button } from 'ui'

import { useDataTable } from './providers/DataTableProvider'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export interface DataTableResetButtonProps {
  /** Called alongside `table.resetColumnFilters()` — for filters that live outside TanStack Table's columnFilters state (e.g. a cross-cutting URL param). */
  onReset?: () => void
}

export function DataTableResetButton({ onReset }: DataTableResetButtonProps) {
  const { table } = useDataTable()
  const reset = () => {
    table.resetColumnFilters()
    onReset?.()
  }

  useShortcut(SHORTCUT_IDS.DATA_TABLE_RESET_FILTERS, reset, {
    registerInCommandMenu: true,
  })

  return (
    <ShortcutTooltip
      shortcutId={SHORTCUT_IDS.DATA_TABLE_RESET_FILTERS}
      label="Reset filters and views"
      side="bottom"
    >
      <Button
        size="tiny"
        variant="outline"
        className="size-7 shrink-0 px-0"
        onClick={reset}
        aria-label="Reset filters and views"
        icon={<RotateCwIcon />}
      />
    </ShortcutTooltip>
  )
}
