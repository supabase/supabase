import { Table } from '@tanstack/react-table'
import { Cable, Database, Hash, type LucideIcon } from 'lucide-react'
import { memo } from 'react'

import { ColumnSchema } from '../../UnifiedLogs.schema'
import {
  postgresSessionFields,
  postgresStatementFields,
  postgresTransactionFields,
} from '../config/serviceFlowFields'
import { BlockFieldConfig } from '../types'
import { DetailRow } from './shared/DetailRow'
import { CollapsibleDetailSection } from './shared/DetailSection'
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

const FieldDetailRow = ({
  config,
  data,
  enrichedData,
  isLoading,
  filterFields,
  table,
}: {
  config: BlockFieldConfig
  data: ColumnSchema
  enrichedData?: Record<string, any>
  isLoading?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  filterFields: DataTableFilterField<any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
  table: Table<any>
}) => {
  const value = config.getValue(data, enrichedData)
  const showSkeleton = !!config.requiresEnrichedData && !!isLoading && !value

  return (
    <DetailRow
      config={config}
      level={data.level}
      value={value}
      filterValue={typeof value === 'string' || typeof value === 'number' ? value : undefined}
      filterFields={filterFields}
      table={table}
      isLoading={showSkeleton}
    />
  )
}

const POSTGRES_SECTIONS: {
  title: string
  icon: LucideIcon
  fields: BlockFieldConfig[]
}[] = [
  { title: 'Statement', icon: Database, fields: postgresStatementFields },
  { title: 'Session', icon: Cable, fields: postgresSessionFields },
  { title: 'Transaction', icon: Hash, fields: postgresTransactionFields },
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
      {/* Only the first section starts open; the rest are a click away */}
      {POSTGRES_SECTIONS.map((section, index) => (
        <CollapsibleDetailSection
          key={section.title}
          title={section.title}
          icon={section.icon}
          defaultOpen={index === 0}
        >
          {section.fields.map((field) => (
            <FieldDetailRow
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
