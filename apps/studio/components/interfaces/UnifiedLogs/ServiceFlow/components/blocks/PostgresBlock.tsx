import { memo } from 'react'
import { ServiceFlowBlockProps } from '../../types'
import { TimelineStep } from '../shared/TimelineStep'
import { BlockField } from '../shared/BlockField'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { postgresPrimaryFields, postgresDetailsFields } from '../../config/serviceFlowFields'

// Postgres
export const PostgresBlock = memo(
  ({
    data,
    enrichedData,
    isLoading,
    isLast = false,
    filterFields,
    table,
  }: ServiceFlowBlockProps) => {
    return (
      <TimelineStep title="Postgres" isLast={isLast}>
        {/* Primary Display Fields */}
        {postgresPrimaryFields.map((field) => (
          <BlockField
            key={field.id}
            config={field}
            data={data}
            enrichedData={enrichedData}
            isLoading={isLoading}
            filterFields={filterFields}
            table={table}
          />
        ))}

        <CollapsibleSection
          title="Connection & Session Details"
          fields={postgresDetailsFields}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
        />
      </TimelineStep>
    )
  }
)

PostgresBlock.displayName = 'PostgresBlock'

export const MemoizedPostgresBlock = memo(PostgresBlock, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading &&
    prev.filterFields === next.filterFields &&
    prev.table === next.table
  )
}) as typeof PostgresBlock
