import {
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormDescription_Shadcn_,
  FormControl_Shadcn_,
  FormMessage_Shadcn_,
} from 'ui'
import { Control } from 'react-hook-form'
import { ReactNode } from 'react'

interface FormFieldWrapperProps {
  control: Control<any>
  name: string
  label: string
  description?: string | ReactNode
  orientation?: 'horizontal' | 'vertical'
  children: (field: any) => ReactNode
}

export function FormFieldWrapper({
  control,
  name,
  label,
  description,
  orientation = 'horizontal',
  children,
}: FormFieldWrapperProps) {
  return (
    <FormField_Shadcn_
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem_Shadcn_
          className={
            orientation === 'horizontal' ? 'grid grid-cols-12 gap-8 items-center' : 'space-y-2'
          }
        >
          <div className={orientation === 'horizontal' ? 'col-span-6' : ''}>
            <FormLabel_Shadcn_ className="text-foreground">{label}</FormLabel_Shadcn_>
            {description && (
              <FormDescription_Shadcn_ className="text-xs">{description}</FormDescription_Shadcn_>
            )}
          </div>
          <div className={orientation === 'horizontal' ? 'col-span-6 flex justify-end' : ''}>
            <FormControl_Shadcn_>{children(field)}</FormControl_Shadcn_>
            <FormMessage_Shadcn_ />
          </div>
        </FormItem_Shadcn_>
      )}
    />
  )
}
