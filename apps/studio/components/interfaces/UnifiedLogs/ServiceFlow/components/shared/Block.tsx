import { memo } from 'react'
import { ServiceFlowBlockProps } from '../../types'
import { TimelineStep } from './TimelineStep'
import { BlockField } from './BlockField'
import { CollapsibleSection } from './CollapsibleSection'
import { FieldWithSeeMore } from './FieldWithSeeMore'
import { BlockFieldConfig } from '../../types'

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

interface BlockProps extends ServiceFlowBlockProps {
  config: BlockConfig
}

export const Block = memo(
  ({ config, data, enrichedData, isLoading, isLast, filterFields, table }: BlockProps) => {
    return (
      <TimelineStep title={config.title} isLast={isLast}>
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
      </TimelineStep>
    )
  }
)

Block.displayName = 'Block'

export const MemoizedBlock = memo(Block, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading &&
    prev.isLast === next.isLast &&
    prev.filterFields === next.filterFields &&
    prev.table === next.table &&
    prev.config === next.config
  )
}) as typeof Block
