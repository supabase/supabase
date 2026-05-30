import { X } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { Kbd } from './primitives/Kbd'
import { useDataTable } from './providers/DataTableProvider'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export function DataTableResetButton() {
  const { table } = useDataTable()
  useShortcut(SHORTCUT_IDS.DATA_TABLE_RESET_FILTERS, () => table.resetColumnFilters())

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="default" size="tiny" onClick={() => table.resetColumnFilters()} icon={<X />}>
          Reset
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>
          Reset filters with{' '}
          <Kbd className="ml-1 text-muted-foreground group-hover:text-accent-foreground">
            <span className="mr-1">⌘</span>
            <span>Esc</span>
          </Kbd>
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
