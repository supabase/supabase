import type { UseFormReturn } from 'react-hook-form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from 'ui'

import { DestinationType } from '../DestinationPanel.types'
import { BigQueryConnectionFields } from './BigQuery/ConnectionFields'
import { TableOptions } from './BigQuery/TableOptions'
import { type DestinationPanelSchemaType } from './DestinationForm.schema'
import { DuckLakeConnectionFields } from './DuckLake/ConnectionFields'
import { ReplicationFields } from './ReplicationFields'
import { SnowflakeConnectionFields } from './Snowflake/ConnectionFields'

export const AdvancedSettings = ({
  type,
  form,
  group = 'all',
}: {
  group?: 'all' | 'connection' | 'data'
  type: DestinationType
  form: UseFormReturn<DestinationPanelSchemaType>
}) => {
  const shouldShowConnection = group !== 'data'
  const shouldShowData = group !== 'connection'
  if (group === 'connection' && type !== 'BigQuery' && type !== 'DuckLake' && type !== 'Snowflake')
    return null

  let description = 'Customize how the pipeline syncs and replicates data.'
  if (type === 'DuckLake' && group === 'all')
    description = 'Adjust catalog connections and replication settings.'
  if (group === 'connection') description = 'Customize destination connection settings.'

  let title = 'Advanced settings'
  if (group === 'connection') title = 'Connection advanced settings'
  if (group === 'data') title = 'Replication advanced settings'

  return (
    <div className="w-full">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="font-normal gap-2 justify-between px-5 py-3 text-sm hover:no-underline">
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-sm font-medium">{title}</span>
              <span className="text-sm text-foreground-lighter font-normal">{description}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-0! pt-3 [&>div]:flex [&>div]:flex-col [&>div]:gap-y-4 [&>div]:px-5">
            {shouldShowConnection && type === 'DuckLake' && (
              <DuckLakeConnectionFields control={form.control} />
            )}

            {shouldShowData && <ReplicationFields control={form.control} />}

            {type === 'BigQuery' && (
              <>
                {shouldShowConnection && <BigQueryConnectionFields control={form.control} />}

                {shouldShowData && (
                  <div className="flex flex-col gap-y-3">
                    <div className="flex flex-col gap-y-1">
                      <span className="text-sm text-foreground">Table layout</span>
                      <p className="text-sm text-foreground-lighter">
                        Partitioning and clustering for each BigQuery table. Applied when a
                        destination table is first created or reset.
                      </p>
                    </div>
                    <TableOptions control={form.control} />
                  </div>
                )}
              </>
            )}

            {shouldShowConnection && type === 'Snowflake' && (
              <SnowflakeConnectionFields control={form.control} />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
