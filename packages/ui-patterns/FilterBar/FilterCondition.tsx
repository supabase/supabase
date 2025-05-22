import React, { useRef, useEffect } from 'react'
import { Input_Shadcn_ } from 'ui'
import { FilterCondition as FilterConditionType, FilterProperty } from './types'

type FilterConditionProps = {
  condition: FilterConditionType
  filterProperties: FilterProperty[]
  id: string
  isActive: boolean
  isOperatorActive: boolean
  isLoading?: boolean
  onOperatorChange: (value: string) => void
  onValueChange: (value: string) => void
  onOperatorFocus: () => void
  onValueFocus: () => void
  onBlur: () => void
  onLabelClick: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export function FilterCondition({
  condition,
  filterProperties,
  id,
  isActive,
  isOperatorActive,
  isLoading,
  onOperatorChange,
  onValueChange,
  onOperatorFocus,
  onValueFocus,
  onBlur,
  onLabelClick,
  onKeyDown,
}: FilterConditionProps) {
  const operatorRef = useRef<HTMLInputElement>(null)
  const valueRef = useRef<HTMLInputElement>(null)
  const property = filterProperties.find((p) => p.name === condition.propertyName)

  useEffect(() => {
    if (isActive && valueRef.current) {
      valueRef.current.focus()
    } else if (isOperatorActive && operatorRef.current) {
      operatorRef.current.focus()
    }
  }, [isActive, isOperatorActive])

  if (!property) return null

  return (
    <div className="flex items-center rounded px-2 h-6 bg-surface-400">
      <span className="text-xs font-medium mr-1 font-mono cursor-pointer" onClick={onLabelClick}>
        {property.label}
      </span>
      <Input_Shadcn_
        ref={operatorRef}
        value={condition.operator}
        onChange={(e) => onOperatorChange(e.target.value)}
        onFocus={onOperatorFocus}
        onBlur={onBlur}
        className="border-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono h-6 mr-1 text-foreground-light"
        style={{
          width: `${Math.max(condition.operator.length, 1)}ch`,
          minWidth: '1ch',
        }}
        disabled={isLoading}
        aria-label={`Operator for ${property.label}`}
      />
      <Input_Shadcn_
        ref={valueRef}
        value={condition.value?.toString() || ''}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={onValueFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="border-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono h-6"
        style={{
          width: `${Math.max(condition.value?.toString().length || 0, 1)}ch`,
          minWidth: '1ch',
        }}
        disabled={isLoading}
        aria-label={`Value for ${property.label}`}
      />
    </div>
  )
}
