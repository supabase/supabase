import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { FormLayout as FormLayoutPrimitive, FormLayoutProps } from './../../forms/layout/FormLayout'

const FormLayout = forwardRef<
  ElementRef<typeof FormLayoutPrimitive>,
  ComponentPropsWithoutRef<typeof FormLayoutPrimitive> & FormLayoutProps // Use any as placeholder types
>(
  (
    {
      afterLabel,
      beforeLabel,
      labelOptional,
      layout,
      label,
      description,
      isReactForm = true,
      ...props
    },
    ref
  ) => (
    <FormLayoutPrimitive
      ref={ref}
      label={label}
      afterLabel={afterLabel}
      beforeLabel={beforeLabel}
      labelOptional={labelOptional}
      layout={layout}
      descriptionText={description}
      isReactForm={isReactForm}
      {...props}
    >
      {props.children}
    </FormLayoutPrimitive>
  )
)

FormLayout.displayName = 'FormLayout'

export { FormLayout }
