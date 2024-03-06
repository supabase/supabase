import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { FormLayout, FormLayoutProps } from '../../forms/layout/FormLayout'
import { Input } from '../../data-inputs/Input'

const InputWithLayout = forwardRef<
  ElementRef<typeof Input>,
  ComponentPropsWithoutRef<typeof Input> & FormLayoutProps
>(
  (
    {
      afterLabel,
      beforeLabel,
      labelOptional,
      layout,
      label,
      description,
      isReactForm = false,
      ...props
    },
    ref
  ) => {
    return (
      <FormLayout
        label={label}
        afterLabel={afterLabel}
        beforeLabel={beforeLabel}
        labelOptional={labelOptional}
        layout={layout}
        descriptionText={description}
        isReactForm={isReactForm}
      >
        <Input ref={ref} {...props} />
      </FormLayout>
    )
  }
)

export { InputWithLayout }
