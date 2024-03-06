import React, { ComponentProps, ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { FormControl_Shadcn_, FormField_Shadcn_, SelectTrigger_Shadcn_, Select_Shadcn_ } from 'ui'
import { FormItemProps, FormItemWrapper } from '../utils'
import { SelectWithLayout } from './SelectWithLayout'

const FormItemSelect = forwardRef<
  ElementRef<typeof SelectWithLayout>,
  ComponentPropsWithoutRef<typeof SelectWithLayout> & FormItemProps<any, any>
>(({ field, ...props }, ref) => (
  <FormItemWrapper>
    <SelectWithLayout
      onValueChange={field.onChange}
      defaultValue={field.value}
      {...field}
      {...props}
      isReactForm={true}
      ref={ref}
    />
  </FormItemWrapper>
))

FormItemSelect.displayName = 'FormItemSelect'

export interface FormFieldSelectProps extends Omit<ComponentProps<typeof SelectWithLayout>, 'ref'> {
  name: React.ComponentProps<typeof FormField_Shadcn_>['name']
  control: any // { key: string }
  formField: Omit<React.ComponentProps<typeof FormField_Shadcn_>, 'ref'>
}

const FormSelect = forwardRef<
  ElementRef<typeof Select_Shadcn_>,
  Omit<ComponentPropsWithoutRef<typeof Select_Shadcn_>, 'name'> & FormFieldSelectProps
>(({ formField, name, control, ...props }, ref) => {
  return (
    <FormField_Shadcn_
      {...formField}
      name={name}
      control={control}
      render={({ field }) => <FormItemSelect ref={ref} {...props} field={field} />}
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
