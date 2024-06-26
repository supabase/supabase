import { ComponentProps, ElementRef, forwardRef } from 'react'
import { FormItem_Shadcn_ } from 'ui'
import { FormLayout } from '../Layout/FormLayout'

const FormItemLayout = forwardRef<
  ElementRef<typeof FormLayout>,
  React.ComponentPropsWithoutRef<typeof FormLayout> & {
    FormItemProps?: ComponentProps<typeof FormItem_Shadcn_>
  }
>(({ FormItemProps, ...props }, ref) => {
  return (
    <FormItem_Shadcn_ {...FormItemProps}>
      <FormLayout ref={ref} isReactForm {...props}>
        {props.children}
      </FormLayout>
    </FormItem_Shadcn_>
  )
})

FormItemLayout.displayName = 'FormItemLayout'

export { FormItemLayout }
