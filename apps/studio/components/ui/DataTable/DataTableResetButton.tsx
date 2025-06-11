import { X } from 'lucide-react'

import { useHotKey } from 'hooks/ui/useHotKey'
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui'
import { Kbd } from './primitives/Kbd'
import { useDataTable } from './providers/DataTableProvider'

export function DataTableResetButton() {
  const { table } = useDataTable()
  useHotKey(table.resetColumnFilters, 'Escape')

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="text"
            size="small"
            onClick={() => table.resetColumnFilters()}
            icon={<X className="h-4 w-4" />}
          >
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
