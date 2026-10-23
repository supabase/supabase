import React, { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { ControllerRenderProps, FieldPath, FieldValues } from 'react-hook-form'
import { FormControl, FormField, FormItem } from 'ui'

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
  ElementRef<typeof FormItem>,
  ComponentPropsWithoutRef<typeof FormItem> // Use any as placeholder types
>(({ ...props }, ref) => (
  <FormItem ref={ref} {...props}>
    <FormControl>{props.children}</FormControl>
  </FormItem>
))

FormItemWrapper.displayName = 'FormItemWrapper'

export { FormItemWrapper }
