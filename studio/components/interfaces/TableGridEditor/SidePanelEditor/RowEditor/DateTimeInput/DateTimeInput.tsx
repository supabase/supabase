import { FC } from 'react'
import { Input } from '@supabase/ui'
import {
  convertInputToPostgresValue,
  convertPostgresToInputValue,
  getColumnType,
} from './DateTimeInput.utils'

interface Props {
  name: string
  format: string
  value: string
  description: string
  onChange: (value: string) => void
}

/**
 * Postgres date/time format and html date/time input format are different.
 * So we to convert the value back and forth.
 */
const DateTimeInput: FC<Props> = ({ value, onChange, name, format, description }) => {
  const inputType = getColumnType(format)
  const formattedValue = convertPostgresToInputValue(inputType, value)

  function handleOnChange(e: any) {
    const temp = e.target.value
    const value = convertInputToPostgresValue({ inputType, format, value: temp })
    onChange(value)
  }

  return (
    <Input
      layout="horizontal"
      className="w-full"
      label={name}
      descriptionText={
        description && description.length !== 0
          ? description
          : format.includes('tz')
          ? 'Your local timezone will be automatically applied'
          : undefined
      }
      labelOptional={format}
      size="small"
      value={formattedValue}
      type={inputType}
      onChange={handleOnChange}
      step={inputType == 'datetime-local' || inputType == 'time' ? '1' : undefined}
    />
  )
}

export default DateTimeInput
