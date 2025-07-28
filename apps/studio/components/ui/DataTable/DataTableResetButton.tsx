import { X } from 'lucide-react'

import { useHotKey } from 'hooks/ui/useHotKey'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Kbd } from './primitives/Kbd'
import { useDataTable } from './providers/DataTableProvider'

export function DataTableResetButton() {
  const { table } = useDataTable()
  useHotKey(table.resetColumnFilters, 'Escape')

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
