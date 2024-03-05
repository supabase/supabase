import React, { ComponentProps, ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { FormControl_Shadcn_, FormField_Shadcn_, FormItem_Shadcn_ } from 'ui'
import { InputWithLayout } from './InputWithLayout'

export interface Props extends Omit<ComponentProps<typeof InputWithLayout>, 'ref'> {
  name: React.ComponentProps<typeof FormField_Shadcn_>['name']
  control: any // { key: string }
  formField: Omit<React.ComponentProps<typeof FormField_Shadcn_>, 'ref'>
}

const FormInput = forwardRef<
  ElementRef<typeof InputWithLayout>,
  Omit<ComponentPropsWithoutRef<typeof InputWithLayout>, 'name'> & Props
>(({ formField, name, control, ...props }, ref) => {
  return (
    <FormField_Shadcn_
      {...formField}
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem_Shadcn_>
          <FormControl_Shadcn_>
            <InputWithLayout {...props} {...field} />
          </FormControl_Shadcn_>
        </FormItem_Shadcn_>
      )}
    />
  )
})

export { FormInput }
