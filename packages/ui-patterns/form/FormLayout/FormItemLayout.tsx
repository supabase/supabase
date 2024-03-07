import { forwardRef } from 'react'
import { FormItem_Shadcn_ } from 'ui'
import { FormLayout } from '../../forms/layout/FormLayout'

export type _FormLayoutProps = {
  description?: string | React.ReactNode | undefined
  label?: string | React.ReactNode
  afterLabel?: string | React.ReactNode
  beforeLabel?: string | React.ReactNode
  labelOptional?: string | React.ReactNode
  layout?: 'horizontal' | 'vertical' | 'flex'
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
    console.log('flex layout', layout)
    return (
      <FormItem_Shadcn_>
        <FormLayout
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
        </FormLayout>
      </FormItem_Shadcn_>
    )
  }
)

FormItemLayout.displayName = 'FormItemLayout'

export { FormItemLayout }
