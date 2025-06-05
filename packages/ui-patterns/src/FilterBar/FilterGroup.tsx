import React, { useState, useRef, useEffect } from 'react'
import { FilterProperty, FilterGroup as FilterGroupType } from './types'
import { ActiveInput } from './FilterBar'
import { FilterCondition } from './FilterCondition'
import { Input_Shadcn_ } from 'ui'

type FilterGroupProps = {
  group: FilterGroupType
  path: number[]
  isLoading?: boolean
  filterProperties: FilterProperty[]
  // Active state
  activeInput: ActiveInput
  onOperatorChange: (path: number[], value: string) => void
  onValueChange: (path: number[], value: string) => void
  onOperatorFocus: (path: number[]) => void
  onValueFocus: (path: number[]) => void
  onBlur: () => void
  onLabelClick: (path: number[]) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  // Group specific props
  onGroupFreeformChange: (path: number[], value: string) => void
  onGroupFreeformFocus: (path: number[]) => void
  groupFreeformValue: string
  isGroupFreeformActive: boolean
  // Logical operator props
  onLogicalOperatorChange?: (path: number[]) => void
}

export function FilterGroup({
  group,
  path,
  isLoading,
  activeInput,
  filterProperties,
  onOperatorChange,
  onValueChange,
  onOperatorFocus,
  onValueFocus,
  onBlur,
  onLabelClick,
  onKeyDown,
  onGroupFreeformChange,
  onGroupFreeformFocus,
  groupFreeformValue,
  isGroupFreeformActive,
  onLogicalOperatorChange,
}: FilterGroupProps) {
  const [localFreeformValue, setLocalFreeformValue] = useState('')
  const freeformInputRef = useRef<HTMLInputElement>(null)
  const [isHoveringOperator, setIsHoveringOperator] = useState(false)
  const isActive =
    isGroupFreeformActive &&
    activeInput?.type === 'group' &&
    path.length === activeInput.path.length &&
    path.every((v, i) => v === activeInput.path[i])

  // Reset local value when group freeform value is cleared
  useEffect(() => {
    if (groupFreeformValue === '') {
      setLocalFreeformValue('')
    }
  }, [groupFreeformValue])

  useEffect(() => {
    if (isActive && freeformInputRef.current) {
      freeformInputRef.current.focus()
    }
  }, [isActive])

  const handleFreeformChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFreeformValue(e.target.value)
    onGroupFreeformChange(path, e.target.value)
  }

  const handleLogicalOperatorClick = () => {
    onLogicalOperatorChange?.(path)
  }

  const handleLogicalOperatorMouseEnter = () => {
    setIsHoveringOperator(true)
  }

  const handleLogicalOperatorMouseLeave = () => {
    setIsHoveringOperator(false)
  }

  const isConditionActive = (conditionPath: number[]) => {
    if (!activeInput) return false
    return (
      activeInput.type === 'value' &&
      conditionPath.length === activeInput.path.length &&
      conditionPath.every((v, i) => v === activeInput.path[i])
    )
  }

  const isOperatorActive = (conditionPath: number[]) => {
    if (!activeInput) return false
    return (
      activeInput.type === 'operator' &&
      conditionPath.length === activeInput.path.length &&
      conditionPath.every((v, i) => v === activeInput.path[i])
    )
  }

  return (
    <div
      className={`flex items-center gap-1 rounded ${
        path.length > 0
          ? "before:content-['('] before:text-foreground-muted after:content-[')'] after:text-foreground-muted"
          : ''
      }`}
    >
      <div className="flex items-center gap-1">
        {group.conditions.map((condition, index) => {
          const currentPath = [...path, index]

          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <span
                  className={`text-xs font-medium cursor-pointer ${
                    isHoveringOperator
                      ? 'bg-surface-400 text-foreground dark:bg-surface-400'
                      : 'text-foreground-muted'
                  }`}
                  onClick={handleLogicalOperatorClick}
                  onMouseEnter={handleLogicalOperatorMouseEnter}
                  onMouseLeave={handleLogicalOperatorMouseLeave}
                >
                  {group.logicalOperator}
                </span>
              )}
              {/* Render condition or nested group */}
              {'logicalOperator' in condition ? (
                <FilterGroup
                  filterProperties={filterProperties}
                  group={condition}
                  path={currentPath}
                  isLoading={isLoading}
                  activeInput={activeInput}
                  onOperatorChange={onOperatorChange}
                  onValueChange={onValueChange}
                  onOperatorFocus={onOperatorFocus}
                  onValueFocus={onValueFocus}
                  onBlur={onBlur}
                  onLabelClick={onLabelClick}
                  onKeyDown={onKeyDown}
                  onGroupFreeformChange={onGroupFreeformChange}
                  onGroupFreeformFocus={onGroupFreeformFocus}
                  groupFreeformValue={groupFreeformValue}
                  isGroupFreeformActive={isGroupFreeformActive}
                  onLogicalOperatorChange={onLogicalOperatorChange}
                />
              ) : (
                <FilterCondition
                  id={`filter-${currentPath.join('-')}`}
                  condition={condition}
                  isActive={isConditionActive(currentPath)}
                  isOperatorActive={isOperatorActive(currentPath)}
                  isLoading={isLoading}
                  onOperatorChange={(value) => onOperatorChange(currentPath, value)}
                  filterProperties={filterProperties}
                  onValueChange={(value) => onValueChange(currentPath, value)}
                  onOperatorFocus={() => onOperatorFocus(currentPath)}
                  onValueFocus={() => onValueFocus(currentPath)}
                  onBlur={onBlur}
                  onLabelClick={() => onLabelClick(currentPath)}
                  onKeyDown={onKeyDown}
                />
              )}
            </React.Fragment>
          )
        })}
        {/* Add freeform input at the end */}
        <Input_Shadcn_
          ref={freeformInputRef}
          value={isActive ? groupFreeformValue : localFreeformValue}
          onChange={handleFreeformChange}
          onFocus={() => onGroupFreeformFocus(path)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className="border-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono h-6"
          placeholder={
            path.length === 0 && group.conditions.length === 0 ? 'Search or filter...' : '+'
          }
          disabled={isLoading}
          style={{
            width: `${Math.max(
              (isActive ? groupFreeformValue : localFreeformValue).length || 1,
              path.length === 0 && group.conditions.length === 0 ? 18 : 1
            )}ch`,
            minWidth: path.length === 0 && group.conditions.length === 0 ? '18ch' : '1ch',
          }}
        />
      </div>
    </div>
  )
}
