'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  cn,
  Input_Shadcn_,
  Popover_Shadcn_,
  PopoverAnchor_Shadcn_,
  PopoverContent_Shadcn_,
} from 'ui'

import { DefaultCommandList } from './DefaultCommandList'
import { useFilterBar } from './FilterBarContext'
import { FilterCondition } from './FilterCondition'
import { useDeferredBlur, useHighlightNavigation } from './hooks'
import { buildPropertyItems } from './menuItems'
import { FilterGroup as FilterGroupType } from './types'
import { pathsEqual } from './utils'

export type FilterGroupProps = {
  group: FilterGroupType
  path: number[]
}

export function FilterGroup({ group, path }: FilterGroupProps) {
  const {
    filterProperties,
    activeInput,
    freeformText,
    isLoading,
    supportsOperators,
    actions,
    variant,
    handleInputBlur,
    handleGroupFreeformFocus,
    handleGroupFreeformChange,
    handleLogicalOperatorChange,
    handleKeyDown,
    handleSelectMenuItem,
  } = useFilterBar()

  const [localFreeformValue, setLocalFreeformValue] = useState('')
  const freeformInputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isHoveringOperator, setIsHoveringOperator] = useState(false)

  const isActive = activeInput?.type === 'group' && pathsEqual(path, activeInput.path)

  // Reset local value when group freeform value is cleared
  useEffect(() => {
    if (freeformText === '') {
      setLocalFreeformValue('')
    }
  }, [freeformText])

  useEffect(() => {
    if (isActive && freeformInputRef.current) {
      freeformInputRef.current.focus()
    }
  }, [isActive])

  const handleFreeformBlur = useDeferredBlur(
    wrapperRef as React.RefObject<HTMLElement>,
    handleInputBlur
  )

  const handleFreeformChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFreeformValue(e.target.value)
    handleGroupFreeformChange(path, e.target.value)
  }

  const handleLogicalOperatorClick = () => {
    handleLogicalOperatorChange(path)
  }

  const isConditionActive = (conditionPath: number[]) => {
    if (!activeInput) return false
    return activeInput.type === 'value' && pathsEqual(conditionPath, activeInput.path)
  }

  const isOperatorActive = (conditionPath: number[]) => {
    if (!activeInput) return false
    return activeInput.type === 'operator' && pathsEqual(conditionPath, activeInput.path)
  }

  const items = useMemo(
    () =>
      buildPropertyItems({
        filterProperties,
        inputValue: (isActive ? freeformText : localFreeformValue) || '',
        actions,
        supportsOperators,
      }),
    [filterProperties, isActive, freeformText, localFreeformValue, actions, supportsOperators]
  )

  // Only the root group should expand to fill available space
  const isRootGroup = path.length === 0

  const {
    highlightedIndex,
    handleKeyDown: handleFreeformKeyDown,
    reset: resetFreeformHighlight,
  } = useHighlightNavigation(
    items.length,
    (index) => {
      if (items[index]) handleSelectMenuItem(items[index])
    },
    handleKeyDown
  )

  useEffect(() => {
    if (!isActive) resetFreeformHighlight()
  }, [isActive, resetFreeformHighlight])

  return (
    <div
      ref={wrapperRef}
      className={`flex items-stretch gap-0 shrink-0 ${
        path.length > 0
          ? "before:content-['('] before:text-foreground-muted after:content-[')'] after:text-foreground-muted"
          : ''
      } ${isRootGroup ? 'flex-1 min-w-0' : ''} ${variant === 'pill' ? 'py-2' : ''}`}
    >
      <div
        className={cn(
          'flex items-stretch',
          isRootGroup ? 'flex-1 min-w-0' : '',
          variant === 'pill' ? 'gap-1' : 'gap-0'
        )}
      >
        {group.conditions.map((condition, index) => {
          const currentPath = [...path, index]

          return (
            <React.Fragment key={index}>
              {index > 0 && supportsOperators && (
                <span
                  className={`text-xs font-medium cursor-pointer ${
                    isHoveringOperator
                      ? 'bg-surface-400 text-foreground dark:bg-surface-400'
                      : 'text-foreground-muted'
                  }`}
                  onClick={handleLogicalOperatorClick}
                  onMouseEnter={() => setIsHoveringOperator(true)}
                  onMouseLeave={() => setIsHoveringOperator(false)}
                >
                  {group.logicalOperator}
                </span>
              )}
              {'logicalOperator' in condition ? (
                <FilterGroup group={condition} path={currentPath} />
              ) : (
                <FilterCondition
                  condition={condition}
                  path={currentPath}
                  isActive={isConditionActive(currentPath)}
                  isOperatorActive={isOperatorActive(currentPath)}
                />
              )}
            </React.Fragment>
          )
        })}
        <Popover_Shadcn_ open={isActive && !isLoading && items.length > 0}>
          <PopoverAnchor_Shadcn_ asChild>
            {isRootGroup ? (
              <Input_Shadcn_
                ref={freeformInputRef}
                type="text"
                value={isActive ? freeformText : localFreeformValue}
                onChange={handleFreeformChange}
                onFocus={() => handleGroupFreeformFocus(path)}
                onBlur={handleFreeformBlur}
                onKeyDown={handleFreeformKeyDown}
                className="border-none bg-transparent text-xs focus:outline-none focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 w-full flex-1 h-auto min-w-0 px-2 py-0"
                placeholder={
                  group.conditions.length === 0
                    ? 'Ask AI for help (e.g. Find all users with name John) or filter...'
                    : 'Add more filters...'
                }
                disabled={isLoading}
              />
            ) : (
              <div className="relative inline-block">
                <Input_Shadcn_
                  ref={freeformInputRef}
                  type="text"
                  value={isActive ? freeformText : localFreeformValue}
                  onChange={handleFreeformChange}
                  onFocus={() => handleGroupFreeformFocus(path)}
                  onBlur={handleFreeformBlur}
                  onKeyDown={handleFreeformKeyDown}
                  className="h-full border-none bg-transparent py-0 text-xs focus:outline-none focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 w-full absolute left-0 top-0 px-2"
                  placeholder="+ Add filter"
                  disabled={isLoading}
                />
                <span className="invisible whitespace-pre text-xs block">
                  {(isActive ? freeformText : localFreeformValue) || '+'}
                </span>
              </div>
            )}
          </PopoverAnchor_Shadcn_>
          <PopoverContent_Shadcn_
            className="min-w-[220px] p-0"
            align="start"
            side="bottom"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              const target = e.target as Node
              if (wrapperRef.current && !wrapperRef.current.contains(target)) {
                handleInputBlur()
              }
            }}
          >
            <DefaultCommandList
              items={items}
              highlightedIndex={highlightedIndex}
              onSelect={handleSelectMenuItem}
              includeIcon
            />
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      </div>
    </div>
  )
}
