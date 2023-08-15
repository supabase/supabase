import dayjs from 'dayjs'
import { ReactNode } from 'react'
import { Input } from 'ui'

import { getColumnType } from './DateTimeInput.utils'

interface DateTimeInputProps {
  name: string
  format: string
  value: string
  description: string | ReactNode
  onChange: (value: string) => void
}

/**
 * Note: HTML Input cannot accept timezones within the value string
 * e.g Yes: 2022-05-13T14:29:03
 *     No:  2022-05-13T14:29:03+0800
 */
const DateTimeInput = ({ value, onChange, name, format, description }: DateTimeInputProps) => {
  const inputType = getColumnType(format)

  function handleOnChange(e: any) {
    const temp = e.target.value
    if (temp.length === 0 && temp !== '') return
    onChange(temp)
  }

  return (
    <Input
      layout="horizontal"
      className="w-full"
      label={name}
      descriptionText={
        <div className="space-y-1">
          {description}
          {format.includes('tz') && (
            <p>Your local timezone will be automatically applied ({dayjs().format('ZZ')})</p>
          )}
        </div>
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
