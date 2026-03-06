import type { Row } from '@tanstack/react-table'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { Button, cn, ResizableHandle, ResizablePanel } from 'ui'
import { LogsList } from './LogsList'

export const LogsListPanel = ({ selectedRow }: { selectedRow?: Row<any> }) => {
  const [open, setOpenState] = useState(true)

  return (
    selectedRow?.original?.logs &&
    selectedRow.original.logs.length > 0 && (
      <>
        <ResizableHandle withHandle disabled={!open} />
        <ResizablePanel
          defaultSize="1"
          maxSize="50"
          minSize={open ? '16' : '12'}
          className={cn(!open ? '!h-12 max-h-12' : 'h-min-16 h-max-32')}
        >
          <div className="h-full flex flex-col overflow-hidden">
            <div className="min-h-12 flex justify-between items-center px-5">
              <div className="flex flex-row items-center gap-2">
                <h3 className="text-sm font-medium">Event logs</h3>
                <span className="text-muted-foreground text-xs bg-muted rounded-md px-1.5 py-0.5">
                  {selectedRow?.original?.logs && Array.isArray(selectedRow?.original?.logs)
                    ? selectedRow?.original?.logs?.length
                    : 0}
                </span>
              </div>
              <Button
                type="default"
                onClick={() => setOpenState(!open)}
                icon={<ChevronDown className={cn('w-4 h-4', !open ? 'rotate-180' : 'rotate-0')} />}
              >
                {open ? 'Close' : 'Open'}
              </Button>
            </div>
            {open && (
              <div className="flex-grow overflow-auto border-t">
                <LogsList logs={selectedRow?.original?.logs} />
              </div>
            )}
          </div>
        </ResizablePanel>
      </>
    )
  )
}
