import { useEffect, useState } from 'react'
import { useFormState, type UseFormReturn } from 'react-hook-form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, cn } from 'ui'

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
  revealInvalidSettings = false,
}: {
  group?: 'all' | 'connection' | 'data'
  revealInvalidSettings?: boolean
  type: DestinationType
  form: UseFormReturn<DestinationPanelSchemaType>
}) => {
  const [expanded, setExpanded] = useState('')
  const { errors } = useFormState({ control: form.control })
  const dataError =
    group !== 'connection' &&
    (errors.maxFillMs ||
      errors.maxTableSyncWorkers ||
      errors.maxCopyConnectionsPerTable ||
      errors.invalidatedSlotBehavior ||
      errors.tableOptions)
  const advancedError =
    dataError ||
    (type === 'BigQuery' && (errors.connectionPoolSize || errors.maxStalenessMins)) ||
    (type === 'DuckLake' && errors.ducklakePoolSize) ||
    (type === 'Snowflake' && errors.snowflakeRole)
  const shouldShowConnection = group !== 'data'
  const shouldShowData = group !== 'connection'

  let description = 'Customize how the pipeline syncs and replicates data.'
  if (type === 'DuckLake' && group === 'all')
    description = 'Adjust catalog connections and replication settings.'
  if (group === 'connection') description = `Adjust how data is written to ${type}.`
  if (group === 'data') description = 'Adjust initial sync and replication slot behavior.'

  useEffect(() => {
    if (revealInvalidSettings && advancedError) setExpanded('item-1')
  }, [revealInvalidSettings, advancedError])

  if (group === 'connection' && type !== 'BigQuery' && type !== 'DuckLake' && type !== 'Snowflake')
    return null

  return (
    <div className={cn('w-full', group !== 'all' && 'border-t border-default')}>
      <Accordion type="single" collapsible value={expanded} onValueChange={setExpanded}>
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="font-normal gap-2 justify-between px-5 py-3 text-sm hover:no-underline">
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-sm font-medium">Advanced settings</span>
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
