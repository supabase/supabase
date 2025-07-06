import { memo } from 'react'
import { useParams } from 'common'
import { ServiceFlowBlockProps } from '../../types'
import { TimelineStep } from '../shared/TimelineStep'
import { BlockField } from '../shared/BlockField'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { storagePrimaryFields, storageDetailsFields } from '../../config/serviceFlowFields'

// Storage
export const StorageBlock = memo(
  ({ data, enrichedData, isLoading, filterFields, table }: ServiceFlowBlockProps) => {
    const { ref: projectRef } = useParams()

    return (
      <TimelineStep title="Storage">
        {/* Primary Display Fields */}
        {storagePrimaryFields.map((field) => (
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
          title="Storage Details"
          fields={storageDetailsFields}
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

StorageBlock.displayName = 'StorageBlock'

export const MemoizedStorageBlock = memo(StorageBlock, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading &&
    prev.filterFields === next.filterFields &&
    prev.table === next.table
  )
}) as typeof StorageBlock
