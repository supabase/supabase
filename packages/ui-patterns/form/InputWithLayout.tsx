import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { FormLayout, FormLayoutProps } from '../forms/layout/FormLayout'
import { Input } from './../data-inputs/Input'

const InputWithLayout = forwardRef<
  ElementRef<typeof Input>,
  Omit<ComponentPropsWithoutRef<typeof Input>, 'name'> & FormLayoutProps
>(({ afterLabel, beforeLabel, labelOptional, layout, label, description, ...props }, ref) => {
  return (
    <FormLayout
      label={label}
      afterLabel={afterLabel}
      beforeLabel={beforeLabel}
      labelOptional={labelOptional}
      layout={layout}
      descriptionText={description}
      size={props.size}
      isForm={false}
    >
      <Input ref={ref} {...props} />
    </FormLayout>
  )
})

export { InputWithLayout }
