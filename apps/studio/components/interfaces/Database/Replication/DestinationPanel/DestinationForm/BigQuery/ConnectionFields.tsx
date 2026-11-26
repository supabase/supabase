import type { ChangeEvent } from 'react'
import type { Control } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormInputGroupInput,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DEFAULT_CONNECTION_POOL_SIZE } from '../DestinationForm.constants'
import type { DestinationPanelSchemaType } from '../DestinationForm.schema'

export const BigQueryConnectionFields = ({
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
        name="connectionPoolSize"
        render={({ field }) => (
          <FormItemLayout
            label="Connection pool size"
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
                  placeholder={String(DEFAULT_CONNECTION_POOL_SIZE)}
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
        name="maxStalenessMins"
        render={({ field }) => (
          <FormItemLayout
            label="Maximum staleness"
            layout="horizontal"
            description="Maximum age of BigQuery query results for newly created or recreated tables; leave blank for the freshest results."
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
  )
}
