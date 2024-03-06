import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { FormLayout, FormLayoutProps } from '../../forms/layout/FormLayout'
import { Checkbox_Shadcn_ } from 'ui'

const CheckboxWithLayout = forwardRef<
  ElementRef<typeof Checkbox_Shadcn_>,
  ComponentPropsWithoutRef<typeof Checkbox_Shadcn_> & Omit<FormLayoutProps, 'layout'>
>(
  (
    { afterLabel, beforeLabel, labelOptional, label, description, isReactForm = false, ...props },
    ref
  ) => {
    return (
      <FormLayout
        label={label}
        afterLabel={afterLabel}
        beforeLabel={beforeLabel}
        labelOptional={labelOptional}
        layout="flex"
        descriptionText={description}
        isReactForm={isReactForm}
        name={props.name}
      >
        <Checkbox_Shadcn_ ref={ref} {...props} />
      </FormLayout>
    )
  }
)

export { CheckboxWithLayout }
