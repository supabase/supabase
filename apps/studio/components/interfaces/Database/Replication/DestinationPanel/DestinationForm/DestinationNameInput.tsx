import type { UseFormReturn } from 'react-hook-form'

import { FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import type { DestinationPanelSchemaType } from './DestinationForm.schema'

type DestinationNameInputProps = {
  form: UseFormReturn<DestinationPanelSchemaType>
}

export const DestinationNameInput = ({ form }: DestinationNameInputProps) => {
  return (
    <FormField_Shadcn_
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItemLayout label="Name" layout="horizontal">
          <FormControl_Shadcn_>
            <Input_Shadcn_ {...field} placeholder="My destination" />
          </FormControl_Shadcn_>
        </FormItemLayout>
      )}
    />
  )
}
