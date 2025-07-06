import { memo } from 'react'
import { ServiceFlowBlockProps } from '../../types'
import { TimelineStep } from '../shared/TimelineStep'
import { BlockField } from '../shared/BlockField'
import { FieldWithSeeMore } from '../shared/FieldWithSeeMore'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import {
  networkPrimaryFields,
  apiKeyPrimaryField,
  apiKeyAdditionalFields,
  userPrimaryField,
  userAdditionalFields,
  locationPrimaryField,
  locationAdditionalFields,
  authorizationFields,
  techDetailsFields,
} from '../../config/serviceFlowFields'

// Network/Cloudflare
export const NetworkBlock = memo(
  ({ data, enrichedData, isLoading, filterFields, table }: ServiceFlowBlockProps) => {
    return (
      <TimelineStep title="Network">
        {/* Primary Display Fields */}
        {networkPrimaryFields.map((field) => (
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

        <FieldWithSeeMore
          primaryField={apiKeyPrimaryField}
          additionalFields={apiKeyAdditionalFields}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
          showValueAsBadge={true}
        />

        <FieldWithSeeMore
          primaryField={userPrimaryField}
          additionalFields={userAdditionalFields}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
        />

        <FieldWithSeeMore
          primaryField={locationPrimaryField}
          additionalFields={locationAdditionalFields}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
        />

        <CollapsibleSection
          title="Authorization"
          fields={authorizationFields}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
        />

        <CollapsibleSection
          title="Tech Details"
          fields={techDetailsFields}
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

NetworkBlock.displayName = 'NetworkBlock'

export const MemoizedNetworkBlock = memo(NetworkBlock, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading &&
    prev.filterFields === next.filterFields &&
    prev.table === next.table
  )
}) as typeof NetworkBlock
