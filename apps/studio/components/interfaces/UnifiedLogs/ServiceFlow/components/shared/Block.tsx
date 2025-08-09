import { SquareDashedBottomCode } from 'lucide-react'
import { memo } from 'react'

import { BlockFieldConfig, ServiceFlowBlockProps } from '../../types'
import { BlockField } from './BlockField'
import { CollapsibleSection } from './CollapsibleSection'
import { FieldWithSeeMore } from './FieldWithSeeMore'
import { TimelineStep } from './TimelineStep'

export interface BlockSection {
  title: string
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
  primaryFields?: BlockFieldConfig[]
  sections?: (BlockSection | FieldWithSeeMoreSection)[]
}

// Simple check: show empty state only for Postgres blocks in non-postgres logs
const shouldShowEmptyState = (config: BlockConfig, data: any): boolean => {
  return config.title === 'Postgres' && data?.log_type !== 'postgres'
}

// Empty state component
const BlockEmptyState = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-surface-300 mb-3">
      <SquareDashedBottomCode size={16} className="text-foreground-light" strokeWidth={1.5} />
    </div>
    <div className="text-sm text-foreground-light mb-1">
      No {title.toLowerCase()} data available
    </div>
    <div className="text-xs text-foreground-lighter">
      This service was involved but no details were captured
    </div>
  </div>
)

export function createBlock(config: BlockConfig) {
  const Block = memo(function Block({
    data,
    enrichedData,
    isLoading,
    isLast,
    filterFields,
    table,
  }: ServiceFlowBlockProps) {
    return (
      <TimelineStep title={config.title} isLast={isLast}>
        {shouldShowEmptyState(config, data) ? (
          <BlockEmptyState title={config.title} />
        ) : (
          <>
            {/* Primary Fields */}
            {config.primaryFields?.map((field) => (
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

            {/* Sections */}
            {config.sections?.map((section, index) => {
              if ('type' in section && section.type === 'fieldWithSeeMore') {
                return (
                  <FieldWithSeeMore
                    key={index}
                    primaryField={section.primaryField}
                    additionalFields={section.additionalFields}
                    data={data}
                    enrichedData={enrichedData}
                    isLoading={isLoading}
                    filterFields={filterFields}
                    table={table}
                    showValueAsBadge={section.showValueAsBadge}
                  />
                )
              }

              // Now we know it's a BlockSection
              const blockSection = section as BlockSection
              return blockSection.collapsible ? (
                <CollapsibleSection
                  key={blockSection.title}
                  title={blockSection.title}
                  fields={blockSection.fields}
                  data={data}
                  enrichedData={enrichedData}
                  isLoading={isLoading}
                  filterFields={filterFields}
                  table={table}
                />
              ) : (
                <div key={blockSection.title}>
                  {blockSection.fields.map((field) => (
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
                </div>
              )
            })}
          </>
        )}
      </TimelineStep>
    )
  })

  Block.displayName = 'Block'

  return Block
}
