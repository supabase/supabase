import { ReactNode } from 'react'
import { cn } from 'ui'

import { getStatusLevel } from '../../../UnifiedLogs.utils'
import { BlockFieldConfig } from '../../types'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'

interface FieldValueProps {
  config: BlockFieldConfig
  value: unknown
  wrap?: boolean
}

export const FieldValue = ({ config, value, wrap }: FieldValueProps): ReactNode => {
  if (value === null || value === undefined || value === '') return null

  if (config.id === 'status') {
    return (
      <DataTableColumnStatusCode
        value={value as string | number}
        level={getStatusLevel(value as string | number)}
        className="text-xs"
      />
    )
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return (
      <span
        className={cn(
          'font-mono text-xs text-foreground',
          wrap ? 'break-all text-right max-w-[calc(100%-12rem)]' : 'truncate text-right',
          'group-hover:underline'
        )}
      >
        {value}
      </span>
    )
  }

  return value as ReactNode
}
