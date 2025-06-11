import { type Column } from '@tanstack/react-table'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { Button, cn, type ButtonProps } from 'ui'

interface DataTableColumnHeaderProps<TData, TValue> extends ButtonProps {
  column: Column<TData, TValue>
  title: string
}

export const DataTableColumnHeader = <TData, TValue>({
  column,
  title,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) => {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  return (
    <Button
      type="text"
      size="small"
      onClick={() => {
        column.toggleSorting(undefined)
      }}
      className={cn(
        'text-xs',
        'py-0 px-0 h-7 hover:bg-transparent flex gap-2 items-center justify-between w-full',
        className
      )}
      iconRight={
        <span className="flex flex-col">
          <ChevronUp
            className={cn(
              '-mb-1 hover:text-foreground-lighter',
              column.getIsSorted() === 'asc' ? 'text-foreground' : 'text-foreground-muted'
            )}
          />
          <ChevronDown
            className={cn(
              '-mt-1 hover:text-foreground-lighter',
              column.getIsSorted() === 'desc' ? 'text-foreground' : 'text-foreground-muted'
            )}
          />
        </span>
      }
      {...props}
    >
      <span>{title}</span>
    </Button>
  )
}
