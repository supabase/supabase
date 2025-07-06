import { memo } from 'react'
import { ServiceFlowBlockProps } from '../../types'
import { TimelineStep } from '../shared/TimelineStep'
import { BlockField } from '../shared/BlockField'
import { authPrimaryFields } from '../../config/serviceFlowFields'

// GoTrue (Auth Service)
export const GoTrueBlock = memo(
  ({ data, enrichedData, isLoading, filterFields, table }: ServiceFlowBlockProps) => {
    return (
      <TimelineStep title="Authentication">
        {/* Primary Display Fields */}
        {authPrimaryFields.map((field) => (
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
      </TimelineStep>
    )
  }
)

GoTrueBlock.displayName = 'GoTrueBlock'

export const MemoizedGoTrueBlock = memo(GoTrueBlock, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading &&
    prev.filterFields === next.filterFields &&
    prev.table === next.table
  )
}) as typeof GoTrueBlock
