import React, { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { ControllerRenderProps, FieldPath, FieldValues } from 'react-hook-form'
import { FormControl_Shadcn_, FormField_Shadcn_, FormItem_Shadcn_ } from 'ui'

/**
 * Handles react-hook-form field type for FormItem<name> components
 */
export interface FormItemProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  field?: ControllerRenderProps<TFieldValues, TName>
}

/**
 * Repeatable wrapper for FormItem<name> components
 */
const FormItemWrapper = forwardRef<
  ElementRef<typeof FormItem_Shadcn_>,
  ComponentPropsWithoutRef<typeof FormItem_Shadcn_> // Use any as placeholder types
>(({ ...props }, ref) => (
  <FormItem_Shadcn_ ref={ref} {...props}>
    <FormControl_Shadcn_>{props.children}</FormControl_Shadcn_>
  </FormItem_Shadcn_>
))

FormItemWrapper.displayName = 'FormItemWrapper'

export { FormItemWrapper }
