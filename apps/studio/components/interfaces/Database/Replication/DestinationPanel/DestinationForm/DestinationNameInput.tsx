import type { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { PIPELINE_NAME_FIELD_COPY } from './DestinationFormFieldCopy'

type DestinationNameInputProps = {
  form: UseFormReturn<DestinationPanelSchemaType>
}

export const DestinationNameInput = ({ form }: DestinationNameInputProps) => {
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
              placeholder="My destination"
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
