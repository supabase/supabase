import React, { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { FieldPath, FieldValues } from 'react-hook-form'
import { FormField_Shadcn_ } from 'ui'
import { FormItemProps, FormItemWrapper } from '../utils'
import { CheckboxWithLayout } from './CheckboxWithLayout'

const FormItemCheckbox = forwardRef<
  ElementRef<typeof CheckboxWithLayout>,
  ComponentPropsWithoutRef<typeof CheckboxWithLayout> & FormItemProps<any, any>
>(({ field, ...props }, ref) => (
  <FormItemWrapper>
    <CheckboxWithLayout {...props} {...field} isReactForm={true} ref={ref} />
  </FormItemWrapper>
))

FormItemCheckbox.displayName = 'FormItemCheckbox'

export interface FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  name: TName
  control: any // { key: string }
  formField?: Omit<React.ComponentProps<typeof FormField_Shadcn_>, 'ref'>
}

const FormFieldCheckbox = forwardRef<
  ElementRef<typeof FormItemCheckbox>,
  ComponentPropsWithoutRef<typeof FormItemCheckbox> & FormFieldProps<any, any> // Use any as placeholder types
>(({ formField, name, control, ...props }, ref) => {
  return (
    <FormField_Shadcn_
      {...formField}
      name={name}
      control={control}
      render={({ field }) => <FormItemCheckbox ref={ref} {...props} field={field} />}
    />
  )
})

FormFieldCheckbox.displayName = 'FormFieldCheckbox'

export { CheckboxWithLayout, FormFieldCheckbox, FormItemCheckbox }
