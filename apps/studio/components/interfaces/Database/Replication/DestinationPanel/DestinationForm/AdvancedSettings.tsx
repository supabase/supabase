import type { ChangeEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  Badge,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  PrePostTab,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DestinationType } from '../DestinationPanel.types'
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
      <Accordion_Shadcn_ type="single" collapsible>
        <AccordionItem_Shadcn_ value="item-1" className="border-none">
          <AccordionTrigger_Shadcn_ className="font-normal gap-2 justify-between text-sm py-3 hover:no-underline">
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-sm font-medium">Advanced settings</span>
              <span className="text-sm text-foreground-lighter font-normal">
                Optional performance tuning
              </span>
            </div>
          </AccordionTrigger_Shadcn_>
          <AccordionContent_Shadcn_ className="!pb-0 pt-3 [&>div]:flex [&>div]:flex-col [&>div]:gap-y-4">
            {/* Batch wait time - applies to all destinations */}
            <FormField_Shadcn_
              control={form.control}
              name="maxFillMs"
              render={({ field }) => (
                <FormItemLayout
                  layout="horizontal"
                  label="Batch wait time"
                  description={
                    <>
                      <p>
                        Maximum time pipeline waits to collect additional changes before flushing a
                        batch.
                      </p>
                      <p>
                        Lower values reduce replication latency, higher values improve batching
                        efficiency.
                      </p>
                    </>
                  }
                >
                  <FormControl_Shadcn_>
                    <PrePostTab postTab="milliseconds">
                      <Input_Shadcn_
                        {...field}
                        type="number"
                        value={field.value ?? ''}
                        onChange={handleNumberChange(field)}
                        placeholder="Default: 10000"
                      />
                    </PrePostTab>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            <FormField_Shadcn_
              control={form.control}
              name="maxTableSyncWorkers"
              render={({ field }) => (
                <FormItemLayout
                  label="Table sync workers"
                  layout="horizontal"
                  description={
                    <>
                      <p>Number of tables copied in parallel during the initial snapshot phase.</p>
                      <p>
                        Each worker uses one replication slot (up to N + 1 total while syncing).
                      </p>
                    </>
                  }
                >
                  <FormControl_Shadcn_>
                    <PrePostTab postTab="workers">
                      <Input_Shadcn_
                        {...field}
                        type="number"
                        value={field.value ?? ''}
                        onChange={handleNumberChange(field)}
                        placeholder="Default: 4"
                      />
                    </PrePostTab>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            <FormField_Shadcn_
              control={form.control}
              name="maxCopyConnectionsPerTable"
              render={({ field }) => (
                <FormItemLayout
                  label="Copy connections per table"
                  layout="horizontal"
                  description={
                    <>
                      <p>
                        Number of parallel connections each table copy can use during initial sync.
                      </p>
                      <p>
                        More connections speed up large table copies, but use more database
                        connections.
                      </p>
                    </>
                  }
                >
                  <FormControl_Shadcn_>
                    <PrePostTab postTab="connections">
                      <Input_Shadcn_
                        {...field}
                        type="number"
                        value={field.value ?? ''}
                        onChange={handleNumberChange(field)}
                        placeholder="Default: 2"
                      />
                    </PrePostTab>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            <FormField_Shadcn_
              control={form.control}
              name="invalidatedSlotBehavior"
              render={({ field }) => (
                <FormItemLayout
                  label="Invalidated slot behavior"
                  layout="horizontal"
                  description="Behavior when the replication slot is invalidated"
                >
                  <FormControl_Shadcn_>
                    <Select_Shadcn_ value={field.value ?? 'error'} onValueChange={field.onChange}>
                      <SelectTrigger_Shadcn_ className="capitalize">
                        {field.value ?? 'error'}
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectItem_Shadcn_ value="error" className="[&>span]:top-2.5">
                          <p>Error</p>
                          <p className="text-foreground-lighter">
                            Blocks startup for manual recovery
                          </p>
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="recreate" className="[&>span]:top-2.5">
                          <p>Recreate</p>
                          <p className="text-foreground-lighter">
                            Rebuilds the slot and restarts replication from scratch
                          </p>
                        </SelectItem_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            {type === 'BigQuery' && (
              <>
                <FormField_Shadcn_
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
                            More connections allow more parallel writes, but consume more resources.
                          </p>
                        </>
                      }
                    >
                      <FormControl_Shadcn_>
                        <PrePostTab postTab="connections">
                          <Input_Shadcn_
                            {...field}
                            type="number"
                            value={field.value ?? ''}
                            onChange={handleNumberChange(field)}
                            placeholder="Default: 4"
                          />
                        </PrePostTab>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                <FormField_Shadcn_
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
                            Maximum allowed age for BigQuery cached metadata before reading base
                            tables.
                          </p>
                          <p>
                            Lower values improve freshness, higher values can reduce query cost and
                            latency.
                          </p>
                        </>
                      }
                    >
                      <FormControl_Shadcn_>
                        <PrePostTab postTab="minutes">
                          <Input_Shadcn_
                            {...field}
                            type="number"
                            value={field.value ?? ''}
                            onChange={handleNumberChange(field)}
                            placeholder="Default: None (No staleness limit)"
                          />
                        </PrePostTab>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </>
            )}
          </AccordionContent_Shadcn_>
        </AccordionItem_Shadcn_>
      </Accordion_Shadcn_>
    </div>
  )
}
