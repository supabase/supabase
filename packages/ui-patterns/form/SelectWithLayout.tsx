import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { Select_Shadcn_ } from 'ui'
import { FormLayout, FormLayoutProps } from '../forms/layout/FormLayout'

const SelectWithLayout = forwardRef<
  ElementRef<typeof Select_Shadcn_>,
  Omit<ComponentPropsWithoutRef<typeof Select_Shadcn_>, 'name'> & FormLayoutProps
>(
  (
    {
      afterLabel,
      beforeLabel,
      labelOptional,
      layout,
      label,
      description,
      isForm = false,
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
        isForm={isForm}
      >
        <Select_Shadcn_ {...props} />
      </FormLayout>
    )
  }
)

export { SelectWithLayout }
