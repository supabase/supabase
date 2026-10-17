import type { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { DestinationType } from '../DestinationPanel.types'
import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { PIPELINE_NAME_FIELD_COPY } from './DestinationFormFieldCopy'

const PIPELINE_NAME_PLACEHOLDERS: Record<DestinationType, string> = {
  BigQuery: 'Analytics Pipeline',
  'Analytics Bucket': 'Iceberg Pipeline',
  DuckLake: 'Lakehouse Pipeline',
  Snowflake: 'Data Warehouse Pipeline',
  ClickHouse: 'Live Analytics Pipeline',
}

type DestinationNameInputProps = {
  form: UseFormReturn<DestinationPanelSchemaType>
  destinationType: DestinationType
}

export const DestinationNameInput = ({ form, destinationType }: DestinationNameInputProps) => {
  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItemLayout
          label={PIPELINE_NAME_FIELD_COPY.label}
          layout="horizontal"
          description={PIPELINE_NAME_FIELD_COPY.description}
        >
          <FormControl>
            <Input
              {...field}
              autoFocus
              placeholder={PIPELINE_NAME_PLACEHOLDERS[destinationType]}
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
              data-bwignore
            />
          </FormControl>
        </FormItemLayout>
      )}
    />
  )
}
