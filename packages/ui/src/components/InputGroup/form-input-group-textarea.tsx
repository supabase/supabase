'use client'

import { useFormField } from '../shadcn/ui/form'
import { InputGroupTextarea } from '../shadcn/ui/input-group'
import type { TextareaProps } from '../shadcn/ui/textarea'

export function FormInputGroupTextArea({ className, ...props }: TextareaProps) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <InputGroupTextarea
      id={formItemId}
      aria-describedby={error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  )
}
