import dayjs from 'dayjs'
import { Edit } from 'lucide-react'
import { ReactNode } from 'react'

import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from 'ui'
import { getColumnType } from './DateTimeInput.utils'

interface DateTimeInputProps {
  name: string
  format: string
  value: string
  isNullable: boolean
  description: string | ReactNode
  onChange: (value: string) => void
}

/**
 * Note: HTML Input cannot accept timezones within the value string
 * e.g Yes: 2022-05-13T14:29:03
 *     No:  2022-05-13T14:29:03+0800
 */
const DateTimeInput = ({
  value,
  onChange,
  name,
  isNullable,
  format,
  description,
}: DateTimeInputProps) => {
  const inputType = getColumnType(format)

  return (
    <Input
      layout="horizontal"
      className={cn('w-full [&>div>div>div>input]:pr-10')}
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
      step={inputType == 'datetime-local' || inputType == 'time' ? '1' : undefined}
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="default" icon={<Edit />} className="px-1.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-28">
            {isNullable && (
              <DropdownMenuItem onClick={() => onChange('')}>Set to NULL</DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() =>
                onChange(
                  dayjs().format(
                    format === 'date'
                      ? 'YYYY-MM-DD'
                      : ['time', 'timetz'].includes(format)
                        ? 'HH:mm:ss'
                        : 'YYYY-MM-DDTHH:mm:ss'
                  )
                )
              }
            >
              Set to now
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export default DateTimeInput
