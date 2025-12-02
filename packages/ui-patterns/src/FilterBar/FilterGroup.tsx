'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Input_Shadcn_, Popover_Shadcn_, PopoverAnchor_Shadcn_, PopoverContent_Shadcn_ } from 'ui'
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
    filters: rootFilters,
    filterProperties,
    activeInput,
    freeformText,
    isLoading,
    supportsOperators,
    aiApiUrl,
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
        aiApiUrl,
        supportsOperators,
      }),
    [filterProperties, isActive, freeformText, localFreeformValue, aiApiUrl, supportsOperators]
  )

  // Determine if this group is the last among its siblings to flex-grow
  const isLastGroupInParent = useMemo(() => {
    if (path.length === 0) return true
    const parentPath = path.slice(0, -1)
    let current: any = rootFilters
    for (let i = 0; i < parentPath.length; i++) {
      const idx = parentPath[i]
      const next = current?.conditions?.[idx]
      if (!next || !('logicalOperator' in next)) return false
      current = next
    }
    const myIndex = path[path.length - 1]
    const siblings = current?.conditions ?? []
    return myIndex === siblings.length - 1
  }, [path, rootFilters])

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
      className={`flex items-center gap-1 rounded ${
        path.length > 0
          ? "before:content-['('] before:text-foreground-muted after:content-[')'] after:text-foreground-muted"
          : ''
      } ${isLastGroupInParent ? 'flex-1 min-w-0' : ''}`}
    >
      <div className={`flex items-center gap-1 ${isLastGroupInParent ? 'flex-1 min-w-0' : ''}`}>
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
            {isLastGroupInParent ? (
              <Input_Shadcn_
                ref={freeformInputRef}
                type="text"
                value={isActive ? freeformText : localFreeformValue}
                onChange={handleFreeformChange}
                onFocus={() => handleGroupFreeformFocus(path)}
                onBlur={handleFreeformBlur}
                onKeyDown={handleFreeformKeyDown}
                className="border-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-6 w-full flex-1 min-w-0"
                placeholder={
                  path.length === 0 && group.conditions.length === 0 ? 'Search or filter...' : '+'
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
                  className="border-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-6 w-full absolute left-0 top-0"
                  placeholder={
                    path.length === 0 && group.conditions.length === 0 ? 'Search or filter...' : '+'
                  }
                  disabled={isLoading}
                />
                <span className="invisible whitespace-pre text-xs block h-6">
                  {(isActive ? freeformText : localFreeformValue) ||
                    (path.length === 0 && group.conditions.length === 0
                      ? 'Search or filter...'
                      : '+')}
                </span>
              </div>
            )}
          </PopoverAnchor_Shadcn_>
          <PopoverContent_Shadcn_
            className="min-w-[220px] p-0"
            align="start"
            side="bottom"
            portal
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
