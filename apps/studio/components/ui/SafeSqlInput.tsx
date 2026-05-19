import { rawSql, type SafeSqlFragment } from '@supabase/pg-meta'
import type { ChangeEvent, ComponentProps } from 'react'
import { Input } from 'ui-patterns/DataInputs/Input'

type InputProps = ComponentProps<typeof Input>

export type SafeSqlInputProps = Omit<InputProps, 'placeholder' | 'value' | 'onChange'> & {
  placeholder?: SafeSqlFragment
  value: SafeSqlFragment
  onChange?: (event: ChangeEvent<HTMLInputElement>, value: SafeSqlFragment) => void
}

export const SafeSqlInput = ({ onChange, ...props }: SafeSqlInputProps) => (
  <Input {...props} onChange={(event) => onChange?.(event, rawSql(event.target.value))} />
)
