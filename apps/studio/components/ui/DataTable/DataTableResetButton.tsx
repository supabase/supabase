import { X } from 'lucide-react'
import { Button } from 'ui'

import { useDataTable } from './providers/DataTableProvider'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export function DataTableResetButton() {
  const { table } = useDataTable()
  useShortcut(SHORTCUT_IDS.DATA_TABLE_RESET_FILTERS, () => table.resetColumnFilters(), {
    registerInCommandMenu: true,
  })

  return (
    <ShortcutTooltip
      shortcutId={SHORTCUT_IDS.DATA_TABLE_RESET_FILTERS}
      label="Reset filters"
      side="left"
    >
      <Button variant="default" size="tiny" onClick={() => table.resetColumnFilters()} icon={<X />}>
        Reset
      </Button>
    </ShortcutTooltip>
  )
}
