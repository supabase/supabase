import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { FilterProperty, FilterGroup as FilterGroupType } from './types'
import { ActiveInput } from './hooks'
import { FilterCondition } from './FilterCondition'
import { Input_Shadcn_, Popover_Shadcn_, PopoverContent_Shadcn_, PopoverAnchor_Shadcn_ } from 'ui'
import { buildPropertyItems, MenuItem } from './menuItems'
import { useDeferredBlur, useHighlightNavigation } from './hooks'
import { DefaultCommandList } from './DefaultCommandList'

type FilterGroupProps = {
  group: FilterGroupType
  path: number[]
  isLoading?: boolean
  rootFilters: FilterGroupType
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
  supportsOperators?: boolean
  // Remove functionality
  onRemove: (path: number[]) => void
  // Options/async
  propertyOptionsCache: Record<string, { options: any[]; searchValue: string }>
  loadingOptions: Record<string, boolean>
  // Menu/selection
  aiApiUrl?: string
  onSelectMenuItem: (item: MenuItem) => void
  setActiveInput: (input: ActiveInput) => void
}

export function FilterGroup({
  group,
  path,
  isLoading,
  rootFilters,
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
  supportsOperators = false,
  onRemove,
  propertyOptionsCache,
  loadingOptions,
  aiApiUrl,
  onSelectMenuItem,
  setActiveInput,
}: FilterGroupProps) {
  const [localFreeformValue, setLocalFreeformValue] = useState('')
  const freeformInputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
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

  const handleFreeformBlur = useDeferredBlur(wrapperRef as React.RefObject<HTMLElement>, onBlur)

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

  const items = useMemo(
    () =>
      buildPropertyItems({
        filterProperties,
        inputValue: (isActive ? groupFreeformValue : localFreeformValue) || '',
        aiApiUrl,
        supportsOperators,
      }),
    [
      filterProperties,
      isActive,
      groupFreeformValue,
      localFreeformValue,
      aiApiUrl,
      supportsOperators,
    ]
  )

  // Determine if this group is the last among its siblings to flex-grow and let input fill
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
      if (items[index]) onSelectMenuItem(items[index])
    },
    onKeyDown
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
                  onMouseEnter={handleLogicalOperatorMouseEnter}
                  onMouseLeave={handleLogicalOperatorMouseLeave}
                >
                  {group.logicalOperator}
                </span>
              )}
              {'logicalOperator' in condition ? (
                <FilterGroup
                  filterProperties={filterProperties}
                  group={condition}
                  path={currentPath}
                  isLoading={isLoading}
                  rootFilters={rootFilters}
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
                  supportsOperators={supportsOperators}
                  onRemove={onRemove}
                  propertyOptionsCache={propertyOptionsCache}
                  loadingOptions={loadingOptions}
                  aiApiUrl={aiApiUrl}
                  onSelectMenuItem={onSelectMenuItem}
                  setActiveInput={setActiveInput}
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
                  onRemove={() => onRemove(currentPath)}
                  rootFilters={rootFilters}
                  path={currentPath}
                  propertyOptionsCache={propertyOptionsCache}
                  loadingOptions={loadingOptions}
                  aiApiUrl={aiApiUrl}
                  onSelectMenuItem={onSelectMenuItem}
                  setActiveInput={setActiveInput}
                />
              )}
            </React.Fragment>
          )
        })}
        <Popover_Shadcn_ open={isActive && !isLoading && items.length > 0}>
          <PopoverAnchor_Shadcn_ asChild>
            <Input_Shadcn_
              ref={freeformInputRef}
              type="text"
              value={isActive ? groupFreeformValue : localFreeformValue}
              onChange={handleFreeformChange}
              onFocus={() => onGroupFreeformFocus(path)}
              onBlur={handleFreeformBlur}
              onKeyDown={handleFreeformKeyDown}
              className={`border-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-6 ${
                isLastGroupInParent ? 'w-full flex-1 min-w-0' : ''
              }`}
              placeholder={
                path.length === 0 && group.conditions.length === 0 ? 'Search or filter...' : '+'
              }
              disabled={isLoading}
              style={
                isLastGroupInParent
                  ? { width: '100%', minWidth: 0 }
                  : {
                      width: `${Math.max(
                        (isActive ? groupFreeformValue : localFreeformValue).length || 1,
                        path.length === 0 && group.conditions.length === 0 ? 18 : 1
                      )}ch`,
                      minWidth: path.length === 0 && group.conditions.length === 0 ? '18ch' : '1ch',
                    }
              }
            />
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
                onBlur()
              }
            }}
          >
            <DefaultCommandList
              items={items}
              highlightedIndex={highlightedIndex}
              onSelect={onSelectMenuItem}
              includeIcon
            />
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      </div>
    </div>
  )
}
