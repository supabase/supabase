import { format } from 'date-fns'
import { ArrowUpDown } from 'lucide-react'
import { useEffect, useState } from 'react'

import { DatePicker } from 'components/ui/DatePicker'
import { Parameter } from 'lib/sql-parameters'
import {
  Button,
  Input_Shadcn_,
  Label_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

interface ParametersPopoverProps {
  parameters: Parameter[]
  parameterValues?: Record<string, string>
  onSubmit?: (parameters: Record<string, string>) => void
  onChange?: (parameters: Record<string, string>) => void
}

export const ParametersPopover = ({
  parameters,
  parameterValues = {},
  onSubmit,
  onChange,
}: ParametersPopoverProps) => {
  const [tempParameters, setTempParameters] = useState<Record<string, string>>(
    parameters.reduce(
      (acc, param) => ({
        ...acc,
        [param.name]: parameterValues[param.name] ?? param.defaultValue ?? '',
      }),
      {}
    )
  )

  // Update temp parameters when external parameters or values change
  useEffect(() => {
    setTempParameters(
      parameters.reduce(
        (acc, param) => ({
          ...acc,
          [param.name]: parameterValues[param.name] ?? param.defaultValue ?? '',
        }),
        {}
      )
    )
  }, [parameters, parameterValues])

  const handleParameterChange = (name: string, value: string) => {
    const newParameters = {
      ...tempParameters,
      [name]: value,
    }
    setTempParameters(newParameters)
    onChange?.(newParameters)
  }

  const renderInput = (param: Parameter) => {
    const currentValue = tempParameters[param.name] ?? parameterValues[param.name] ?? ''

    if (param.type === 'date') {
      // Check if the current value is a valid date
      const isValidDate = currentValue && !isNaN(new Date(currentValue).getTime())

      if (isValidDate) {
        return (
          <DatePicker
            selectsRange={false}
            from={currentValue}
            to={currentValue}
            onChange={(date) => {
              if (date && date.to) {
                handleParameterChange(param.name, date.to)
              } else {
                handleParameterChange(param.name, '')
              }
            }}
          >
            <span>{currentValue ? format(new Date(currentValue), 'dd MMM') : 'Pick a date'}</span>
          </DatePicker>
        )
      }

      // Fallback to regular input if date is invalid
      return (
        <Input_Shadcn_
          size="tiny"
          value={currentValue}
          onChange={(e) => handleParameterChange(param.name, e.target.value)}
        />
      )
    }

    if (param.type === 'enum' && param.possibleValues) {
      return (
        <Select_Shadcn_
          value={currentValue}
          onValueChange={(value) => handleParameterChange(param.name, value)}
        >
          <SelectTrigger_Shadcn_ className="h-8">
            <SelectValue_Shadcn_ placeholder="Select value" />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            {param.possibleValues.map((value) => (
              <SelectItem_Shadcn_ key={value} value={value}>
                {value}
              </SelectItem_Shadcn_>
            ))}
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
      )
    }

    return (
      <Input_Shadcn_
        size="tiny"
        value={currentValue}
        onChange={(e) => handleParameterChange(param.name, e.target.value)}
      />
    )
  }

  return (
    <Popover_Shadcn_ modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button icon={<ArrowUpDown size={14} />} type="text" size="tiny" className="w-7 h-7" />
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ side="bottom" align="end" className="w-[300px] p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            {parameters.map((param) => (
              <div key={param.name} className="grid gap-2">
                <Label_Shadcn_ className="flex items-center gap-2">
                  {param.name}
                  {param.occurrences > 1 && (
                    <span className="text-xs text-foreground-light">
                      (used {param.occurrences} times)
                    </span>
                  )}
                </Label_Shadcn_>
                {renderInput(param)}
              </div>
            ))}
          </div>
          {onSubmit && (
            <div className="flex justify-end">
              <Button type="primary" size="tiny" onClick={() => onSubmit(tempParameters)}>
                Apply changes
              </Button>
            </div>
          )}
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
