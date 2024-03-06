import React, { ComponentProps, ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import {
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import { InputWithLayout } from '../withLayout/InputWithLayout'
import { SelectWithLayout } from '../withLayout/SelectWithLayout'

export interface Props extends Omit<ComponentProps<typeof InputWithLayout>, 'ref'> {
  name: React.ComponentProps<typeof FormField_Shadcn_>['name']
  control: any // { key: string }
  formField: Omit<React.ComponentProps<typeof FormField_Shadcn_>, 'ref'>
}

const FormSelect = forwardRef<
  ElementRef<typeof Select_Shadcn_>,
  Omit<ComponentPropsWithoutRef<typeof Select_Shadcn_>, 'name'> & Props
>(({ formField, name, control, ...props }, ref) => {
  return (
    <FormField_Shadcn_
      {...formField}
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem_Shadcn_>
          <FormControl_Shadcn_>
            <SelectWithLayout
              onValueChange={field.onChange}
              defaultValue={field.value}
              {...props}
              {...field}
              isReactForm={true}
            />
          </FormControl_Shadcn_>
        </FormItem_Shadcn_>
      )}
    />
  )
})

const FormSelectTrigger = forwardRef<
  ElementRef<typeof SelectTrigger_Shadcn_>,
  ComponentPropsWithoutRef<typeof SelectTrigger_Shadcn_>
>(({ ...props }, ref) => {
  return (
    <FormControl_Shadcn_>
      <SelectTrigger_Shadcn_ {...props} />
    </FormControl_Shadcn_>
  )
})

export { FormSelect, FormSelectTrigger }
