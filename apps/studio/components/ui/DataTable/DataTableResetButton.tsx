import { X } from 'lucide-react'
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
      label="Reset filters"
      side="left"
    >
      <Button variant="default" size="tiny" onClick={reset} icon={<X />}>
        Reset
      </Button>
    </ShortcutTooltip>
  )
}
