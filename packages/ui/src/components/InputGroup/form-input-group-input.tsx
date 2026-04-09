'use client'

import { useFormField } from '../shadcn/ui/form'
import type { InputProps } from '../shadcn/ui/input'
import { InputGroupInput } from '../shadcn/ui/input-group'

export function FormInputGroupInput(props: InputProps) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <InputGroupInput
      id={formItemId}
      aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  )
}
