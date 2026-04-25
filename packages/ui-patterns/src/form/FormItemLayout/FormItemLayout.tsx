import { ElementRef, forwardRef } from 'react'
import { FormItem } from 'ui'

import { FormLayout } from '../Layout/FormLayout'

const FormItemLayout = forwardRef<
  ElementRef<typeof FormLayout>,
  React.ComponentPropsWithoutRef<typeof FormLayout> // Use any as placeholder types
>(({ ...props }, ref) => {
  return (
    <FormItem>
      <FormLayout ref={ref} isReactForm {...props}>
        {props.children}
      </FormLayout>
    </FormItem>
  )
})

FormItemLayout.displayName = 'FormItemLayout'

export { FormItemLayout }
