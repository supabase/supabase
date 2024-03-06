import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { FormLayout as FormLayoutPrimitive, FormLayoutProps } from './../../forms/layout/FormLayout'
import { cva, type VariantProps } from 'class-variance-authority'

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

export type _FormLayoutProps = {
  description?: string | React.ReactNode | undefined
  label?: string | React.ReactNode
  afterLabel?: string
  beforeLabel?: string
  labelOptional?: string | React.ReactNode
  layout?: 'horizontal' | 'vertical'
  isReactForm?: boolean
  hideMessage?: boolean
}

const FormItemLayout = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & _FormLayoutProps // Use any as placeholder types
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
  ) => {
    const FormItemLayoutVariants = cva('', {
      variants: {
        variant: {
          default: 'bg-blue-300 text-primary-foreground hover:bg-primary/90',
          destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
          outline:
            'border border-control bg-background hover:bg-accent hover:text-accent-foreground',
          secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          ghost: 'hover:bg-accent hover:text-accent-foreground',
          link: 'text-primary underline-offset-4 hover:underline',
        },
      },
      defaultVariants: {
        variant: 'default',
      },
    })

    return (
      <div
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
      </div>
    )
  }
)

FormItemLayout.displayName = 'FormItemLayout'

export { FormLayout, FormItemLayout }
