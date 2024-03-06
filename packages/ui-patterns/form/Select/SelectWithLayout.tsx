import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { Select_Shadcn_ } from 'ui'
import { FormLayout, FormLayoutProps } from '../../forms/layout/FormLayout'

const SelectWithLayout = forwardRef<
  ElementRef<typeof Select_Shadcn_>,
  ComponentPropsWithoutRef<typeof Select_Shadcn_> & FormLayoutProps
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
        <Select_Shadcn_ {...props} />
      </FormLayout>
    )
  }
)

export { SelectWithLayout }
