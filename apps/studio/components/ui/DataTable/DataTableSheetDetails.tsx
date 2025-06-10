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
    <div className="relative bg-sidebar">
      <div className="flex items-center justify-between gap-2 pl-5 pr-2 py-1">
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
                  className="px-1"
                  icon={<ChevronUp />}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Navigate <Kbd>↑</Kbd>
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
                  className="px-1"
                  icon={<ChevronDown />}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Navigate <Kbd>↓</Kbd>
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Separator orientation="vertical" className="mx-1" />

          <Button
            size="tiny"
            type="text"
            onClick={() => table.resetRowSelection()}
            className="px-1"
            icon={<X />}
          />
        </div>
      </div>
      <Separator />
      {children}
    </div>
  )
}
