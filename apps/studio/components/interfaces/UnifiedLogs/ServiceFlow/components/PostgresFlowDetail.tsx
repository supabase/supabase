import { Table } from '@tanstack/react-table'
import { CableIcon, DatabaseIcon, HashIcon, type LucideIcon } from 'lucide-react'
import { memo } from 'react'

import { ColumnSchema } from '../../UnifiedLogs.schema'
import {
  postgresSessionFields,
  postgresStatementFields,
  postgresTransactionFields,
} from '../config/serviceFlowFields'
import { BlockFieldConfig } from '../types'
import { ConfiguredDetailRow } from './shared/ConfiguredDetailRow'
import { CollapsibleDetailSection } from '@/components/ui/DataTable/CollapsibleDetailSection'
import { DataTableFilterField } from '@/components/ui/DataTable/DataTable.types'

interface PostgresFlowDetailProps {
  data: ColumnSchema
  enrichedData?: Record<string, any>
  isLoading?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  filterFields: DataTableFilterField<any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  table: Table<any>
}

const POSTGRES_SECTIONS: {
  title: string
  icon: LucideIcon
  fields: BlockFieldConfig[]
}[] = [
  { title: 'Statement', icon: DatabaseIcon, fields: postgresStatementFields },
  { title: 'Session', icon: CableIcon, fields: postgresSessionFields },
  { title: 'Transaction', icon: HashIcon, fields: postgresTransactionFields },
]

export const PostgresFlowDetail = memo(function PostgresFlowDetail({
  data,
  enrichedData,
  isLoading,
  filterFields,
  table,
}: PostgresFlowDetailProps) {
  return (
    <div>
      {POSTGRES_SECTIONS.map((section, index) => (
        <CollapsibleDetailSection
          key={section.title}
          title={section.title}
          icon={section.icon}
          defaultOpen={index === 0}
          className="border-b"
        >
          {section.fields.map((field) => (
            <ConfiguredDetailRow
              key={field.id}
              config={field}
              data={data}
              enrichedData={enrichedData}
              isLoading={isLoading}
              filterFields={filterFields}
              table={table}
            />
          ))}
        </CollapsibleDetailSection>
      ))}
    </div>
  )
})

PostgresFlowDetail.displayName = 'PostgresFlowDetail'
