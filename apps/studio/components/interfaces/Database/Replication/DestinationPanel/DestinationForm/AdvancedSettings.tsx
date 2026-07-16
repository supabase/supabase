import type { ChangeEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
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
import {
  DEFAULT_CONNECTION_POOL_SIZE,
  DEFAULT_MAX_COPY_CONNECTIONS_PER_TABLE,
  DEFAULT_MAX_FILL_MS,
  DEFAULT_MAX_TABLE_SYNC_WORKERS,
} from './DestinationForm.constants'
import { type DestinationPanelSchemaType } from './DestinationForm.schema'

export const AdvancedSettings = ({
  type,
  form,
}: {
  type: DestinationType
  form: UseFormReturn<DestinationPanelSchemaType>
}) => {
  const handleNumberChange =
    (field: { onChange: (value?: number) => void }) => (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      field.onChange(val === '' ? undefined : Number(val))
    }

  return (
    <div className="px-5">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="font-normal gap-2 justify-between text-sm py-3 hover:no-underline">
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-sm font-medium">Advanced settings</span>
              <span className="text-sm text-foreground-lighter font-normal">
                Optional settings to control the pipeline in more depth
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-0! pt-3 [&>div]:flex [&>div]:flex-col [&>div]:gap-y-4">
            {/* Batch wait time - applies to all destinations */}
            <FormField
              control={form.control}
              name="maxFillMs"
              render={({ field }) => (
                <FormItemLayout
                  layout="horizontal"
                  label="Batch wait time"
                  description={
                    <>
                      <p>
                        Maximum time after the first buffered initial-sync row or ongoing change
                        before the pipeline flushes a partially filled batch. Size and memory limits
                        can cause an earlier flush.
                      </p>
                      <p>
                        Lower values can reduce batching delay; higher values can improve
                        destination write efficiency.
                      </p>
                    </>
                  }
                >
                  <FormControl>
                    <InputGroup>
                      <FormInputGroupInput
                        {...field}
                        type="number"
                        value={field.value ?? ''}
                        onChange={handleNumberChange(field)}
                        placeholder={`Default: ${DEFAULT_MAX_FILL_MS}`}
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
                  description={
                    <>
                      <p>Maximum number of tables synced in parallel during the initial sync.</p>
                      <p>
                        Each active table sync temporarily uses one additional replication slot, for
                        up to N + 1 slots including the pipeline's main slot.
                      </p>
                    </>
                  }
                >
                  <FormControl>
                    <InputGroup>
                      <FormInputGroupInput
                        {...field}
                        type="number"
                        value={field.value ?? ''}
                        onChange={handleNumberChange(field)}
                        placeholder={`Default: ${DEFAULT_MAX_TABLE_SYNC_WORKERS}`}
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
                  label="Copy connections per table"
                  layout="horizontal"
                  description={
                    <>
                      <p>
                        Maximum source database connections used to copy one table in parallel
                        during the initial sync.
                      </p>
                      <p>
                        With multiple table sync workers, source connection usage can scale with
                        both settings.
                      </p>
                    </>
                  }
                >
                  <FormControl>
                    <InputGroup>
                      <FormInputGroupInput
                        {...field}
                        type="number"
                        value={field.value ?? ''}
                        onChange={handleNumberChange(field)}
                        placeholder={`Default: ${DEFAULT_MAX_COPY_CONNECTIONS_PER_TABLE}`}
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
                  description="What happens when the pipeline's main replication slot can no longer continue from its retained WAL."
                >
                  <FormControl>
                    <Select value={field.value ?? 'error'} onValueChange={field.onChange}>
                      <SelectTrigger className="capitalize">{field.value ?? 'error'}</SelectTrigger>
                      <SelectContent>
                        <SelectItem value="error" className="[&>span]:top-2.5">
                          <p>Error</p>
                          <p className="text-foreground-lighter">
                            Blocks startup for manual recovery.
                          </p>
                        </SelectItem>
                        <SelectItem value="recreate" className="[&>span]:top-2.5">
                          <p>Recreate</p>
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
                <FormField
                  control={form.control}
                  name="connectionPoolSize"
                  render={({ field }) => (
                    <FormItemLayout
                      label={
                        <div className="flex flex-col gap-y-2">
                          <span>Connection pool size</span>
                          <Badge className="w-min">BigQuery only</Badge>
                        </div>
                      }
                      layout="horizontal"
                      description={
                        <>
                          <p>Size of the BigQuery Storage Write API connection pool.</p>
                          <p>
                            More connections can increase destination write throughput, but consume
                            more pipeline and BigQuery resources.
                          </p>
                        </>
                      }
                    >
                      <FormControl>
                        <InputGroup>
                          <FormInputGroupInput
                            {...field}
                            type="number"
                            value={field.value ?? ''}
                            onChange={handleNumberChange(field)}
                            placeholder={`Default: ${DEFAULT_CONNECTION_POOL_SIZE}`}
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
                  name="maxStalenessMins"
                  render={({ field }) => (
                    <FormItemLayout
                      label={
                        <div className="flex flex-col gap-y-2">
                          <span>Maximum staleness</span>
                          <Badge className="w-min">BigQuery only</Badge>
                        </div>
                      }
                      layout="horizontal"
                      description={
                        <>
                          <p>
                            Maximum acceptable staleness of table data returned by queries while
                            BigQuery applies CDC changes in the background.
                          </p>
                          <p>
                            Leave unset for the freshest results. A larger number of minutes allows
                            BigQuery to return older data, which can reduce query-time CDC merge
                            cost and latency. For example, 15 allows data to be up to 15 minutes
                            stale.
                          </p>
                          <p>
                            Applied when a table is created or recreated. Changing this value does
                            not alter existing destination tables.
                          </p>
                        </>
                      }
                    >
                      <FormControl>
                        <InputGroup>
                          <FormInputGroupInput
                            {...field}
                            type="number"
                            min={0}
                            max={65535}
                            step={1}
                            value={field.value ?? ''}
                            onChange={handleNumberChange(field)}
                            placeholder="Default: None (Freshest results)"
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>minutes</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
