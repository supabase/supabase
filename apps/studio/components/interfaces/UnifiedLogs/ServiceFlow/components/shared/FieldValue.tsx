import { ReactNode } from 'react'
import { cn } from 'ui'

import { BlockFieldConfig } from '../../types'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'

interface FieldValueProps {
  config: BlockFieldConfig
  value: unknown
  wrap?: boolean
  level?: string
}

export const FieldValue = ({ config, value, wrap, level }: FieldValueProps): ReactNode => {
  if (value === null || value === undefined || value === '') return null

  if (config.id === 'status') {
    return (
      <DataTableColumnStatusCode
        value={value as string | number}
        level={level}
        className="text-xs"
      />
    )
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return (
      <span
        className={cn(
          'font-mono text-xs text-foreground',
          wrap ? 'break-all text-right' : 'truncate text-right'
        )}
      >
        {value}
      </span>
    )
  }

  return value as ReactNode
}
