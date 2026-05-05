import { ReactNode } from 'react'

import { getStatusLevel } from '../../../UnifiedLogs.utils'
import { BlockFieldConfig } from '../../types'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'

interface FieldValueProps {
  config: BlockFieldConfig
  value: unknown
}

export const FieldValue = ({ config, value }: FieldValueProps): ReactNode => {
  if (value === null || value === undefined || value === '') return value as ReactNode

  if (config.id === 'status') {
    return (
      <DataTableColumnStatusCode
        value={value as string | number}
        level={getStatusLevel(value as string | number)}
        className="text-xs"
      />
    )
  }

  return value as ReactNode
}
