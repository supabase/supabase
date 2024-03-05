import React, { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { FormControl_Shadcn_, FormField_Shadcn_, FormItem_Shadcn_ } from 'ui'
import { FormLayout } from '../forms/layout/FormLayout'
import { Input } from './../data-inputs/Input'

export interface Props {
  description?: string | React.ReactNode | undefined
  label?: string | React.ReactNode
  afterLabel?: string
  beforeLabel?: string
  labelOptional?: string | React.ReactNode
  layout?: 'horizontal' | 'vertical'
  name: React.ComponentProps<typeof FormField_Shadcn_>['name']
  control: React.ComponentProps<typeof FormField_Shadcn_>['control']
  formField: Omit<React.ComponentProps<typeof FormField_Shadcn_>, 'ref'>
}

const FormInput = forwardRef<
  ElementRef<typeof Input>,
  Omit<ComponentPropsWithoutRef<typeof Input>, 'name'> & Props
>(
  (
    {
      afterLabel,
      beforeLabel,
      labelOptional,
      layout,
      label,
      description,
      formField,
      name,
      control,
      ...props
    },
    ref
  ) => {
    return (
      <FormField_Shadcn_
        {...formField}
        name={name}
        control={control}
        render={({ field }) => (
          <FormItem_Shadcn_>
            <FormLayout
              label={label}
              afterLabel={afterLabel}
              beforeLabel={beforeLabel}
              labelOptional={labelOptional}
              layout={layout}
              descriptionText={description}
              size={props.size}
            >
              <FormControl_Shadcn_>
                <Input {...props} {...field} />
              </FormControl_Shadcn_>
            </FormLayout>
          </FormItem_Shadcn_>
        )}
      />
    )
  }
)

export { FormInput }
