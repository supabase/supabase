import { partition } from 'lodash'
import { LucideIcon } from 'lucide-react'
import { memo } from 'react'

import { BlockFieldConfig, ServiceFlowBlockProps } from '../../types'
import { ConfiguredDetailRow } from './ConfiguredDetailRow'
import { CollapsibleDetailSection } from './DetailSection'

interface BlockSection {
  title: string
  icon?: LucideIcon
  fields: BlockFieldConfig[]
  collapsible?: boolean
}

interface FieldWithSeeMoreSection {
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

export function createBlock(config: BlockConfig) {
  const Block = memo(function Block({
    data,
    enrichedData,
    isLoading,
    filterFields,
    table,
    defaultOpen = false,
  }: ServiceFlowBlockProps) {
    const [seeMoreFieldsSections, otherSections] = partition(
      config.sections,
      (x) => 'type' in x && x.type === 'fieldWithSeeMore'
    ) as [FieldWithSeeMoreSection[], BlockSection[]]

    /**
     * [Joshen] AFAICT, a lot of the fields do not apply for auth logs as the data is not present
     * Am opting to hide all the additional fields only for auth logs, but we can present them if
     * we do eventually have the data to show
     */

    return (
      <>
        <CollapsibleDetailSection title={config.title} icon={config.icon} defaultOpen={defaultOpen}>
          {config.primaryFields?.map((field) => (
            <ConfiguredDetailRow
              key={field.id}
              config={field}
              data={data}
              enrichedData={enrichedData}
              isLoading={isLoading}
              filterFields={filterFields}
              table={table}
            />
          ))}
          {data.log_type !== 'auth' &&
            seeMoreFieldsSections.map((section) => {
              return [section.primaryField, ...section.additionalFields].map((field) => (
                <ConfiguredDetailRow
                  key={field.id}
                  config={field}
                  data={data}
                  enrichedData={enrichedData}
                  isLoading={isLoading}
                  filterFields={filterFields}
                  table={table}
                />
              ))
            })}
        </CollapsibleDetailSection>

        {data.log_type !== 'auth' &&
          otherSections.map((section) => {
            return (
              <CollapsibleDetailSection
                key={section.title}
                title={section.title}
                icon={section.icon}
                defaultOpen={false}
              >
                {section.fields.map((field) => (
                  <ConfiguredDetailRow
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
            )
          })}
      </>
    )
  })

  Block.displayName = 'Block'
  return Block
}
