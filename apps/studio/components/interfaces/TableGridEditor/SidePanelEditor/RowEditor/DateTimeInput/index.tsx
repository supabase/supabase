import dayjs from 'dayjs'
import { Edit } from 'lucide-react'
import { ReactNode } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { getColumnType } from './DateTimeInput.utils'

interface DateTimeInputProps {
  name: string
  format: string
  value: string
  isNullable: boolean
  description: string | ReactNode
  onChange: (value: string | null) => void
  disabled?: boolean
}

/**
 * Note: HTML Input cannot accept timezones within the value string
 * e.g Yes: 2022-05-13T14:29:03
 *     No:  2022-05-13T14:29:03+0800
 */
export const DateTimeInput = ({
  value,
  onChange,
  name,
  isNullable,
  format,
  description,
  disabled = false,
}: DateTimeInputProps) => {
  const inputType = getColumnType(format)

  return (
    <FormItemLayout
      layout="horizontal"
      label={name}
      labelOptional={format}
      description={
        <div className="space-y-1">
          {description}
          {format.includes('tz') && (
            <p>Your local timezone will be automatically applied ({dayjs().format('ZZ')})</p>
          )}
        </div>
      }
      isReactForm={false}
    >
      <InputGroup>
        <InputGroupInput
          size="small"
          value={value}
          type={inputType}
          step={inputType == 'datetime-local' || inputType == 'time' ? '1' : undefined}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <InputGroupAddon align="inline-end">
          {!disabled && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InputGroupButton type="default" icon={<Edit />} className="px-1.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-28 pointer-events-auto">
                {isNullable && (
                  <DropdownMenuItem onClick={() => onChange(null)}>Set to NULL</DropdownMenuItem>
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
          )}
        </InputGroupAddon>
      </InputGroup>
    </FormItemLayout>
  )
}
