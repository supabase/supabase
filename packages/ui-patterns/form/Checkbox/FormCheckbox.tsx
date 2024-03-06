import React, { ComponentProps, ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { FormControl_Shadcn_, FormField_Shadcn_, FormItem_Shadcn_ } from 'ui'
import { InputWithLayout } from '../withLayout/InputWithLayout'
import { CheckboxWithLayout } from '../withLayout/CheckboxWithLayout'

export interface Props extends Omit<ComponentProps<typeof InputWithLayout>, 'ref'> {
  name: React.ComponentProps<typeof FormField_Shadcn_>['name']
  control: any // { key: string }
  formField?: Omit<React.ComponentProps<typeof FormField_Shadcn_>, 'ref'>
}

const FormCheckbox = forwardRef<
  ElementRef<typeof CheckboxWithLayout>,
  Omit<ComponentPropsWithoutRef<typeof CheckboxWithLayout>, 'name'> & Props
>(({ formField, name, control, ...props }, ref) => {
  return (
    <FormField_Shadcn_
      {...formField}
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem_Shadcn_>
          <FormControl_Shadcn_>
            <CheckboxWithLayout
              {...props}
              {...field}
              isReactForm={true}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl_Shadcn_>
        </FormItem_Shadcn_>
      )}
    />
  )
})

export { FormCheckbox }
