import type { ChangeEvent } from 'react'
import type { Control } from 'react-hook-form'
import { FormControl, FormField, Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DEFAULT_DUCKLAKE_POOL_SIZE } from '../DestinationForm.constants'
import type { DestinationPanelSchemaType } from '../DestinationForm.schema'

export const DuckLakeConnectionFields = ({
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
    <FormField
      control={control}
      name="ducklakePoolSize"
      render={({ field }) => (
        <FormItemLayout
          layout="horizontal"
          label="Pool size"
          description="Maximum concurrent connections this pipeline opens to the catalog. Choose 1 to 6."
        >
          <FormControl>
            <Input
              {...field}
              type="number"
              min={1}
              max={6}
              value={field.value ?? ''}
              onChange={handleNumberChange(field)}
              placeholder={String(DEFAULT_DUCKLAKE_POOL_SIZE)}
            />
          </FormControl>
        </FormItemLayout>
      )}
    />
  )
}
