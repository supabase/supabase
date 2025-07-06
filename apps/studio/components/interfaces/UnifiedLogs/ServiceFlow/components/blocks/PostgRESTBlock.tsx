import { memo } from 'react'
import { ServiceFlowBlockProps } from '../../types'
import { TimelineStep } from '../shared/TimelineStep'
import { BlockField } from '../shared/BlockField'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { postgrestPrimaryFields, postgrestResponseFields } from '../../config/serviceFlowFields'

// PostgREST
export const PostgRESTBlock = memo(
  ({ data, enrichedData, isLoading, filterFields, table }: ServiceFlowBlockProps) => {
    return (
      <TimelineStep title="Data API">
        {/* Primary Display Fields */}
        {postgrestPrimaryFields.map((field) => (
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
          title="Response Details"
          fields={postgrestResponseFields}
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

PostgRESTBlock.displayName = 'PostgRESTBlock'

export const MemoizedPostgRESTBlock = memo(PostgRESTBlock, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading &&
    prev.filterFields === next.filterFields &&
    prev.table === next.table
  )
}) as typeof PostgRESTBlock
