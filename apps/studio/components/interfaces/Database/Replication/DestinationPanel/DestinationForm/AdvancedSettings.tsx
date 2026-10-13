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
}: {
  type: DestinationType
  form: UseFormReturn<DestinationPanelSchemaType>
}) => {
  return (
    <div className="w-full">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="font-normal gap-2 justify-between px-5 py-3 text-sm hover:no-underline">
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-sm font-medium">Advanced settings</span>
              <span className="text-sm text-foreground-lighter font-normal">
                {type === 'DuckLake'
                  ? 'Adjust catalog connections and replication settings.'
                  : 'Customize how the pipeline syncs and replicates data.'}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-0! pt-3 [&>div]:flex [&>div]:flex-col [&>div]:gap-y-4 [&>div]:px-5">
            {type === 'DuckLake' && <DuckLakeConnectionFields control={form.control} />}

            <ReplicationFields control={form.control} />

            {type === 'BigQuery' && (
              <>
                <BigQueryConnectionFields control={form.control} />

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
              </>
            )}

            {type === 'Snowflake' && <SnowflakeConnectionFields control={form.control} />}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
