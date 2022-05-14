import { FC } from 'react'
import { Input } from '@supabase/ui'
import { getColumnType } from './DateTimeInput.utils'

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

  function handleOnChange(e: any) {
    const temp = e.target.value
    if (temp.length === 0) return
    onChange(temp)
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
      value={value}
      type={inputType}
      onChange={handleOnChange}
      step={inputType == 'datetime-local' || inputType == 'time' ? '1' : undefined}
    />
  )
}

export default DateTimeInput
