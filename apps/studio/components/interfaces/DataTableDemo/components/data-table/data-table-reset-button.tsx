'use client'

import { X } from 'lucide-react'
import { Button } from 'ui'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui'
import { Kbd } from 'components/interfaces/DataTableDemo/components/custom/kbd'
import { useHotKey } from 'components/interfaces/DataTableDemo/hooks/use-hot-key'
import { useDataTable } from 'components/interfaces/DataTableDemo/components/data-table/data-table-provider'

export function DataTableResetButton() {
  const { table } = useDataTable()
  useHotKey(table.resetColumnFilters, 'Escape')

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="text" size="small" onClick={() => table.resetColumnFilters()}>
            <X className="mr-2 h-4 w-4" />
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
    </TooltipProvider>
  )
}
