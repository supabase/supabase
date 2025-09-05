import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Label } from '@ui/components/shadcn/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/components/shadcn/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/shadcn/ui/select'
import { Button, cn } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { z } from 'zod'

const OPERATOR_LABELS = {
  '=': 'Equals',
  '>=': 'Greater than or equal to',
  '<=': 'Less than or equal to',
  '>': 'Greater than',
  '<': 'Less than',
  '!=': 'Not equal to',
} satisfies Record<ComparisonOperator, string>

const comparisonOperatorSchema = z.enum(['=', '>=', '<=', '>', '<', '!='])
export type ComparisonOperator = z.infer<typeof comparisonOperatorSchema>

export const numericFilterSchema = z.object({
  operator: comparisonOperatorSchema,
  value: z.number(),
})
export type NumericFilter = z.infer<typeof numericFilterSchema>

interface ReportsNumericFilterProps {
  label: string
  value: NumericFilter | null
  onChange: (value: NumericFilter | null) => void
  operators?: ComparisonOperator[]
  defaultOperator?: ComparisonOperator
  placeholder?: string
  min?: number
  max?: number
  step?: number
  isLoading?: boolean
  className?: string
}

export const ReportsNumericFilter = ({
  label,
  value,
  onChange,
  operators = ['=', '>=', '<=', '>', '<', '!='],
  defaultOperator = '=',
  placeholder = 'Enter value',
  min,
  max,
  step = 1,
  isLoading = false,
  className,
}: ReportsNumericFilterProps) => {
  const [open, setOpen] = useState(false)
  const [tempValue, setTempValue] = useState<NumericFilter | null>(value)

  const isActive = value !== null

  useEffect(() => {
    if (!open) {
      setTempValue(value)
    }
  }, [open, value])

  const handleApply = () => {
    onChange(tempValue)
    setOpen(false)
  }

  const getDisplayValue = () => {
    if (value) {
      return `${value.operator} ${value.value}`
    }
    return ''
  }

  const handleOperatorChange = (operator: ComparisonOperator) => {
    setTempValue({
      operator,
      value: tempValue?.value ?? 0,
    })
  }

  const handleValueChange = (inputValue: string) => {
    if (inputValue === '') {
      setTempValue(null)
    } else {
      const numericValue = parseFloat(inputValue)
      if (!isNaN(numericValue)) {
        setTempValue({
          operator: tempValue?.operator ?? defaultOperator,
          value: numericValue,
        })
      }
    }
  }

  const handleClearAll = () => {
    setTempValue(null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type={isActive ? 'default' : 'outline'}
          className={cn(
            'min-w-20 border-dashed relative group justify-between',
            { 'border-solid': isActive },
            className
          )}
          iconRight={<ChevronDown size={14} />}
        >
          <span>
            {label}
            {getDisplayValue() && (
              <span className="ml-1 text-xs font-mono text-foreground-light">
                {getDisplayValue()}
              </span>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 w-72" portal={true}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleApply()
          }}
          className="px-3 py-3 flex flex-col gap-y-3"
        >
          <div className="flex flex-col gap-y-1">
            <Label className="text-xs">Operator</Label>
            <Select
              value={tempValue?.operator || defaultOperator}
              onValueChange={handleOperatorChange}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op} value={op} className="text-xs flex items-center">
                    <span className="font-mono">{op}</span>
                    <span className="text-foreground-light ml-2">{OPERATOR_LABELS[op]}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-y-1">
            <Label className="text-xs">Value</Label>
            <Input
              autoFocus
              type="number"
              placeholder={placeholder}
              value={tempValue?.value || ''}
              onChange={(e) => handleValueChange(e.target.value)}
              min={min}
              max={max}
              step={step}
            />
            {(min !== undefined || max !== undefined) && (
              <p className="text-xs text-foreground-light">
                {min !== undefined && max !== undefined
                  ? `Range: ${min} - ${max}`
                  : min !== undefined
                    ? `Min: ${min}`
                    : `Max: ${max}`}
              </p>
            )}
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-default p-2">
          <Button size="tiny" type="outline" onClick={handleClearAll}>
            Clear
          </Button>
          <Button
            loading={isLoading}
            size="tiny"
            type="primary"
            onClick={handleApply}
            htmlType="button"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
