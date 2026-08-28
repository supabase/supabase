import type { ChangeEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  cn,
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

export type AdvancedSettingsGroup = 'all' | 'connection' | 'data'

const DATA_DESCRIPTION = 'Optional settings for initial sync and replication slots.'
const ALL_DESCRIPTION = 'Optional settings to control the pipeline in more depth.'

const getConnectionDescription = (type: DestinationType) =>
  `Optional settings for how data is written to ${type}.`

export const AdvancedSettings = ({
  type,
  form,
  group = 'all',
  flush = false,
  className,
}: {
  type: DestinationType
  form: UseFormReturn<DestinationPanelSchemaType>
  group?: AdvancedSettingsGroup
  flush?: boolean
  className?: string
}) => {
  const showConnection = group === 'all' || group === 'connection'
  const showData = group === 'all' || group === 'data'
  const description =
    group === 'connection'
      ? getConnectionDescription(type)
      : group === 'data'
        ? DATA_DESCRIPTION
        : ALL_DESCRIPTION

  const handleNumberChange =
    (field: { onChange: (value?: number) => void }) => (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      field.onChange(val === '' ? undefined : Number(val))
    }

  return (
    <div className={cn(flush ? 'border-b last:border-none' : 'px-5', className)}>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger
            className={cn(
              'font-normal gap-2 justify-between text-sm py-3 hover:no-underline',
              flush && 'rounded-none px-(--card-padding-x) py-4'
            )}
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-sm font-medium">Advanced settings</span>
              <span className="text-sm text-foreground-lighter font-normal">{description}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent
            className={cn(
              'pb-0! pt-3 [&>div]:flex [&>div]:flex-col [&>div]:gap-y-4',
              flush && 'px-(--card-padding-x)'
            )}
          >
            {showConnection && (
              <FormField
                control={form.control}
                name="maxFillMs"
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="Batch wait time"
                    description="How long the pipeline waits before sending a partially filled batch."
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
            )}

            {showData && (
              <>
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
                      description="What the pipeline does when its replication slot becomes invalid."
                    >
                      <FormControl>
                        <Select value={field.value ?? 'error'} onValueChange={field.onChange}>
                          <SelectTrigger className="capitalize">
                            {field.value ?? 'error'}
                          </SelectTrigger>
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
              </>
            )}

            {showConnection && type === 'BigQuery' && (
              <>
                <FormField
                  control={form.control}
                  name="connectionPoolSize"
                  render={({ field }) => (
                    <FormItemLayout
                      label={
                        group === 'all' ? (
                          <div className="flex flex-col gap-y-2">
                            <span>Connection pool size</span>
                            <Badge className="w-min">BigQuery only</Badge>
                          </div>
                        ) : (
                          'Connection pool size'
                        )
                      }
                      layout="horizontal"
                      description="Number of BigQuery connections used for destination writes."
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
                        group === 'all' ? (
                          <div className="flex flex-col gap-y-2">
                            <span>Maximum staleness</span>
                            <Badge className="w-min">BigQuery only</Badge>
                          </div>
                        ) : (
                          'Maximum staleness'
                        )
                      }
                      layout="horizontal"
                      description="How old query results can be while BigQuery applies ongoing changes."
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
