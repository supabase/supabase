import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { ReactNode, useCallback, useEffect, useMemo } from 'react'

import {
  Button,
  cn,
  Separator,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'ui'
import { Kbd } from './primitives/Kbd'
import { useDataTable } from './providers/DataTableProvider'

export interface DataTableSheetDetailsProps {
  title?: ReactNode
  titleClassName?: string
  children?: ReactNode
}

export function DataTableSheetDetails({
  title,
  titleClassName,
  children,
}: DataTableSheetDetailsProps) {
  const { table, rowSelection, isLoading } = useDataTable()

  const selectedRowKey = Object.keys(rowSelection)?.[0]

  const selectedRow = useMemo(() => {
    if (isLoading && !selectedRowKey) return
    return table.getCoreRowModel().flatRows.find((row) => row.id === selectedRowKey)
  }, [selectedRowKey, isLoading])

  const index = table.getCoreRowModel().flatRows.findIndex((row) => row.id === selectedRow?.id)

  const nextId = useMemo(() => table.getCoreRowModel().flatRows[index + 1]?.id, [index, isLoading])

  const prevId = useMemo(() => table.getCoreRowModel().flatRows[index - 1]?.id, [index, isLoading])

  const onPrev = useCallback(() => {
    if (prevId) table.setRowSelection({ [prevId]: true })
  }, [prevId, isLoading])

  const onNext = useCallback(() => {
    if (nextId) table.setRowSelection({ [nextId]: true })
  }, [nextId, isLoading])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!selectedRowKey) return

      // REMINDER: prevent dropdown navigation inside of sheet to change row selection
      const activeElement = document.activeElement
      const isMenuActive = activeElement?.closest('[role="menu"]')

      if (isMenuActive) return

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        onPrev()
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        onNext()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [selectedRowKey, onNext, onPrev])

  return (
    // <Sheet
    //   open={!!selectedRowKey}
    //   onOpenChange={() => {
    //     // REMINDER: focus back to the row that was selected
    //     // We need to manually focus back due to missing Trigger component
    //     const el = selectedRowKey ? document.getElementById(selectedRowKey) : null
    //     table.resetRowSelection()

    //     // REMINDER: when navigating between tabs in the sheet and exit the sheet, the tab gets lost
    //     // We need a minimal delay to allow the sheet to close before focusing back to the row
    //     setTimeout(() => el?.focus(), 0)
    //   }}
    // >
    // <SheetContent
    //   // onCloseAutoFocus={(e) => e.preventDefault()}
    //   className="overflow-y-auto p-0 sm:max-w-md"
    //   hideClose
    // >
    // <SheetHeader className="sticky top-0 z-10 border-b bg-background p-4">
    <div className="relative bg-sidebar">
      <div className="flex items-center justify-between gap-2 px-5 py-1">
        <h5 className={cn(titleClassName, 'truncate text-left')}>
          {isLoading && !selectedRowKey ? <Skeleton className="h-7 w-36" /> : title}
        </h5>
        <div className="flex h-7 items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="tiny"
                  type="text"
                  disabled={!prevId}
                  onClick={onPrev}
                  className="px-0"
                  icon={<ChevronUp />}
                >
                  <span className="sr-only">Previous</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Navigate <Kbd variant="outline">↑</Kbd>
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="tiny"
                  type="text"
                  disabled={!nextId}
                  onClick={onNext}
                  className="px-0"
                  icon={<ChevronDown />}
                >
                  <span className="sr-only">Next</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Navigate <Kbd variant="outline">↓</Kbd>
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Separator orientation="vertical" className="mx-1" />
          {/* <SheetClose autoFocus={true} asChild> */}
          <Button
            size="tiny"
            type="text"
            onClick={() => table.resetRowSelection()}
            className="px-0"
            icon={<X />}
          >
            <span className="sr-only">Close</span>
          </Button>
          {/* </SheetClose> */}
        </div>
      </div>
      <Separator />
      {children}
    </div>
  )
}
