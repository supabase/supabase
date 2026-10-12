import type { ChangeEvent } from 'react'
import type { Control } from 'react-hook-form'
import {
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

import {
  DEFAULT_MAX_COPY_CONNECTIONS_PER_TABLE,
  DEFAULT_MAX_FILL_MS,
  DEFAULT_MAX_TABLE_SYNC_WORKERS,
} from './DestinationForm.constants'
import { type DestinationPanelSchemaType } from './DestinationForm.schema'

const INVALIDATED_SLOT_BEHAVIOR_LABELS = {
  error: 'Block startup',
  recreate: 'Recreate slot',
}

export const ReplicationFields = ({
  control,
}: {
  control: Control<DestinationPanelSchemaType>
}) => {
  const handleNumberChange =
    (field: { onChange: (value: number | '') => void }) => (e: ChangeEvent<HTMLInputElement>) => {
      const parsed = e.target.valueAsNumber
      field.onChange(e.target.value === '' || Number.isNaN(parsed) ? '' : parsed)
    }

  return (
    <>
      <FormField
        control={control}
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
        control={control}
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
        control={control}
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
        control={control}
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
                    <p className="text-foreground-lighter">Blocks startup for manual recovery.</p>
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
    </>
  )
}
