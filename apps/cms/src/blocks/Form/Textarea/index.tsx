import type { TextField } from '@payloadcms/plugin-form-builder/types'
import type { FieldErrorsImpl, FieldValues, UseFormRegister } from 'react-hook-form'

import { Label } from '@/components/ui/label'
import { Textarea as TextAreaComponent } from '@/components/ui/textarea'
import React from 'react'

import { Error } from '../Error'
import { Width } from '../Width'

export const Textarea: React.FC<
  TextField & {
    errors: Partial<FieldErrorsImpl>
    register: UseFormRegister<FieldValues>
    rows?: number
  }
> = ({ name, defaultValue, errors, label, register, required, rows = 3, width }) => {
  return (
    <Width width={width}>
      <Label htmlFor={name}>
        {label}

        {required && (
          <span className="required">
            * <span className="sr-only">(required)</span>
          </span>
        )}
      </Label>

      <TextAreaComponent
        defaultValue={defaultValue}
        id={name}
        rows={rows}
        {...register(name, { required: required })}
      />

      {errors[name] && <Error name={name} />}
    </Width>
  )
}
