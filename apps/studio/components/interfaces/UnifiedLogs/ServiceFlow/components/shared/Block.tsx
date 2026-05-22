import { LucideIcon } from 'lucide-react'
import { memo } from 'react'

import { BlockFieldConfig, BlockFieldProps, ServiceFlowBlockProps } from '../../types'
import { DetailRow } from './DetailRow'
import { DetailSectionHeader } from './DetailSection'
import { FieldValue } from './FieldValue'

export interface BlockSection {
  title: string
  icon?: LucideIcon
  fields: BlockFieldConfig[]
  collapsible?: boolean
}

export interface FieldWithSeeMoreSection {
  type: 'fieldWithSeeMore'
  primaryField: BlockFieldConfig
  additionalFields: BlockFieldConfig[]
  showValueAsBadge?: boolean
}

export interface BlockConfig {
  title: string
  icon?: LucideIcon
  primaryFields?: BlockFieldConfig[]
  sections?: (BlockSection | FieldWithSeeMoreSection)[]
}

const FieldRow = ({
  config,
  data,
  enrichedData,
  isLoading,
  filterFields,
  table,
}: BlockFieldProps) => {
  const value = config.getValue(data, enrichedData)
  const showSkeleton = !!config.requiresEnrichedData && !!isLoading && !value
  return (
    <DetailRow
      label={config.label}
      value={<FieldValue config={config} value={value} wrap={config.wrap} />}
      filterId={config.id}
      filterValue={typeof value === 'string' || typeof value === 'number' ? value : undefined}
      filterFields={filterFields}
      table={table}
      isLoading={showSkeleton}
      wrap={config.wrap}
    />
  )
}

export function createBlock(config: BlockConfig) {
  const Block = memo(function Block({
    data,
    enrichedData,
    isLoading,
    filterFields,
    table,
  }: ServiceFlowBlockProps) {
    return (
      <>
        <DetailSectionHeader title={config.title} icon={config.icon} />

        {config.primaryFields?.map((field) => (
          <FieldRow
            key={field.id}
            config={field}
            data={data}
            enrichedData={enrichedData}
            isLoading={isLoading}
            filterFields={filterFields}
            table={table}
          />
        ))}

        {config.sections?.map((section) => {
          if ('type' in section && section.type === 'fieldWithSeeMore') {
            return [section.primaryField, ...section.additionalFields].map((field) => (
              <FieldRow
                key={field.id}
                config={field}
                data={data}
                enrichedData={enrichedData}
                isLoading={isLoading}
                filterFields={filterFields}
                table={table}
              />
            ))
          }

          const blockSection = section as BlockSection
          return (
            <span key={blockSection.title} className="contents">
              <DetailSectionHeader title={blockSection.title} icon={blockSection.icon} />
              {blockSection.fields.map((field) => (
                <FieldRow
                  key={field.id}
                  config={field}
                  data={data}
                  enrichedData={enrichedData}
                  isLoading={isLoading}
                  filterFields={filterFields}
                  table={table}
                />
              ))}
            </span>
          )
        })}
      </>
    )
  })

  Block.displayName = 'Block'
  return Block
}
