import { Table2 } from 'lucide-react'
import { Button } from 'ui'
import type { DataTableRendererProps } from './types'

interface DataTableEmptyProps {
  emptyState?: DataTableRendererProps['emptyState']
}

export function DataTableEmpty({ emptyState }: DataTableEmptyProps) {
  const Icon = emptyState?.icon ?? <Table2 className="h-8 w-8 text-foreground-lighter" />

  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="text-foreground-lighter">{Icon}</div>
      <div>
        <p className="text-sm font-medium text-foreground">{emptyState?.title ?? 'No data'}</p>
        {emptyState?.description && (
          <p className="mt-1 text-xs text-foreground-lighter">{emptyState.description}</p>
        )}
      </div>
      {emptyState?.action && (
        <Button type="default" size="tiny" onClick={emptyState.action.onClick}>
          {emptyState.action.label}
        </Button>
      )}
    </div>
  )
}
