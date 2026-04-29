import { LucideIcon } from 'lucide-react'
import { memo, ReactNode } from 'react'

import { getStatusLevel } from '../../../UnifiedLogs.utils'
import { BlockFieldConfig, ServiceFlowBlockProps } from '../../types'
import { DetailRow } from './DetailRow'
import { DetailSectionHeader } from './DetailSection'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'

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

const renderValue = (config: BlockFieldConfig, value: unknown): ReactNode => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ServiceFlow types convention
const FieldRow = ({ config, data, enrichedData, isLoading, filterFields, table }: any) => {
  const value = config.getValue(data, enrichedData)
  const showSkeleton = !!config.requiresEnrichedData && !!isLoading && !value
  return (
    <DetailRow
      label={config.label}
      value={renderValue(config, value)}
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
