import type { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'

type DestinationNameInputProps = {
  form: UseFormReturn<DestinationPanelSchemaType>
}

export const DestinationNameInput = ({ form }: DestinationNameInputProps) => {
  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItemLayout label="Name" layout="horizontal">
          <FormControl>
            <Input_Shadcn_ {...field} placeholder="My destination" />
          </FormControl>
        </FormItemLayout>
      )}
    />
  )
}
