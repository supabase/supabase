import type { ChangeEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  FormControl,
  FormField,
  FormInputGroupInput,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DestinationType } from '../DestinationPanel.types'
import { BigQueryConnectionFields } from './BigQuery/ConnectionFields'
import { TableOptions } from './BigQuery/TableOptions'
import {
  DEFAULT_MAX_COPY_CONNECTIONS_PER_TABLE,
  DEFAULT_MAX_FILL_MS,
  DEFAULT_MAX_TABLE_SYNC_WORKERS,
} from './DestinationForm.constants'
import { type DestinationPanelSchemaType } from './DestinationForm.schema'
import { DuckLakeConnectionFields } from './DuckLake/ConnectionFields'
import { SnowflakeConnectionFields } from './Snowflake/ConnectionFields'

const INVALIDATED_SLOT_BEHAVIOR_LABELS = {
  error: 'Block startup',
  recreate: 'Recreate slot',
}

export const AdvancedSettings = ({
  type,
  form,
}: {
  type: DestinationType
  form: UseFormReturn<DestinationPanelSchemaType>
}) => {
  const handleNumberChange =
    (field: { onChange: (value: number | '') => void }) => (e: ChangeEvent<HTMLInputElement>) => {
      const parsed = e.target.valueAsNumber
      field.onChange(e.target.value === '' || Number.isNaN(parsed) ? '' : parsed)
    }

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

            <FormField
              control={form.control}
              name="maxFillMs"
              render={({ field }) => (
                <FormItemLayout
                  layout="horizontal"
                  label="Batch wait time"
                  description="Maximum time before sending a partially filled batch."
                >
                  <FormControl>
                    <InputGroup>
                      <FormInputGroupInput
                        {...field}
                        type="number"
                        min={0}
                        step={1}
                        value={field.value ?? ''}
                        onChange={handleNumberChange(field)}
                        placeholder={String(DEFAULT_MAX_FILL_MS)}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>milliseconds</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                </FormItemLayout>
              )}
            />

            <FormField
              control={form.control}
              name="maxTableSyncWorkers"
              render={({ field }) => (
                <FormItemLayout
                  label="Table sync workers"
                  layout="horizontal"
                  description="Maximum number of tables synced at the same time."
                >
                  <FormControl>
                    <InputGroup>
                      <FormInputGroupInput
                        {...field}
                        type="number"
                        min={1}
                        step={1}
                        value={field.value ?? ''}
                        onChange={handleNumberChange(field)}
                        placeholder={String(DEFAULT_MAX_TABLE_SYNC_WORKERS)}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>workers</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                </FormItemLayout>
              )}
            />

            <FormField
              control={form.control}
              name="maxCopyConnectionsPerTable"
              render={({ field }) => (
                <FormItemLayout
                  label="Initial sync connections per table"
                  layout="horizontal"
                  description="Maximum number of source connections used to sync existing rows for each table."
                >
                  <FormControl>
                    <InputGroup>
                      <FormInputGroupInput
                        {...field}
                        type="number"
                        min={1}
                        step={1}
                        value={field.value ?? ''}
                        onChange={handleNumberChange(field)}
                        placeholder={String(DEFAULT_MAX_COPY_CONNECTIONS_PER_TABLE)}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>connections</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                </FormItemLayout>
              )}
            />

            <FormField
              control={form.control}
              name="invalidatedSlotBehavior"
              render={({ field }) => (
                <FormItemLayout
                  label="Invalidated slot behavior"
                  layout="horizontal"
                  description="What the pipeline does when its replication slot becomes invalid."
                >
                  <FormControl>
                    <Select value={field.value ?? 'error'} onValueChange={field.onChange}>
                      <SelectTrigger>
                        {INVALIDATED_SLOT_BEHAVIOR_LABELS[field.value ?? 'error']}
                      </SelectTrigger>
                      <SelectContent side="bottom" collisionPadding={16}>
                        <SelectItem value="error" className="[&>span]:top-2.5">
                          <p>Block startup</p>
                          <p className="text-foreground-lighter">
                            Blocks startup for manual recovery.
                          </p>
                        </SelectItem>
                        <SelectItem value="recreate" className="[&>span]:top-2.5">
                          <p>Recreate slot</p>
                          <p className="text-foreground-lighter">
                            Replaces destination tables and runs a new, billable initial sync.
                          </p>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItemLayout>
              )}
            />

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
