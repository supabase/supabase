import React, { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { FormField_Shadcn_ } from 'ui'
import { FormItemProps, FormItemWrapper } from '../utils'
import { InputWithLayout } from './InputWithLayout'

const FormItemInput = forwardRef<
  ElementRef<typeof InputWithLayout>,
  ComponentPropsWithoutRef<typeof InputWithLayout> & FormItemProps<any, any>
>(({ field, ...props }, ref) => (
  <FormItemWrapper>
    <InputWithLayout {...field} {...props} isReactForm={true} ref={ref} />
  </FormItemWrapper>
))

FormItemInput.displayName = 'FormItemInput'

export interface FormFieldInputProps {
  name: (typeof FormItemInput)['name']
  control: any // { key: string }
  formField?: Omit<React.ComponentProps<typeof FormField_Shadcn_>, 'ref'>
}

const FormFieldInput = forwardRef<
  ElementRef<typeof FormItemInput>,
  ComponentPropsWithoutRef<typeof FormItemInput> & FormFieldInputProps
>(({ formField, name, control, ...props }, ref) => {
  return (
    <FormField_Shadcn_
      {...formField}
      name={name}
      control={control}
      render={({ field }) => <FormItemInput ref={ref} {...props} field={field} />}
    />
  )
})

export { FormItemInput, FormFieldInput }
