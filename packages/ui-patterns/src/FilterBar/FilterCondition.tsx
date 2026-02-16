'use client'

import { X } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  cn,
  Input_Shadcn_,
  Popover_Shadcn_,
  PopoverAnchor_Shadcn_,
  PopoverContent_Shadcn_,
} from 'ui'

import { DefaultCommandList } from './DefaultCommandList'
import { useFilterBar } from './FilterBarContext'
import { useDeferredBlur, useHighlightNavigation } from './hooks'
import { buildOperatorItems, buildValueItems } from './menuItems'
import { FilterCondition as FilterConditionType } from './types'

export type FilterConditionProps = {
  condition: FilterConditionType
  path: number[]
  isActive: boolean
  isOperatorActive: boolean
  isHighlighted: boolean
}

export function FilterCondition({
  condition,
  path,
  isActive,
  isOperatorActive,
  isHighlighted,
}: FilterConditionProps) {
  const {
    filters: rootFilters,
    filterProperties,
    isLoading,
    propertyOptionsCache,
    loadingOptions,
    handleOperatorChange,
    handleInputChange,
    handleOperatorFocus,
    handleInputFocus,
    handleInputBlur,
    handleLabelClick,
    handleKeyDown,
    handleRemoveCondition,
    handleSelectMenuItem,
    setActiveInput,
    variant,
  } = useFilterBar()

  const operatorRef = useRef<HTMLInputElement>(null)
  const valueRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const property = filterProperties.find((p) => p.name === condition.propertyName)
  const [showValueCustom, setShowValueCustom] = useState(false)
  const [hasTypedOperator, setHasTypedOperator] = useState(false)
  const [hasTypedValue, setHasTypedValue] = useState(false)
  const [localValue, setLocalValue] = useState((condition.value ?? '').toString())

  const conditionValue = (condition.value ?? '').toString()

  // Reset "has typed" state when focus changes
  useEffect(() => {
    if (!isOperatorActive) setHasTypedOperator(false)
  }, [isOperatorActive])

  useEffect(() => {
    if (!isActive) setHasTypedValue(false)
  }, [isActive])

  // Sync local value with condition.value when it changes externally (e.g., dropdown selection)
  useEffect(() => {
    if (localValue !== conditionValue) {
      setLocalValue(conditionValue)
    }
  }, [conditionValue])

  useEffect(() => {
    if (isActive && valueRef.current) {
      valueRef.current.focus()
    } else if (isOperatorActive && operatorRef.current) {
      operatorRef.current.focus()
    }
  }, [isActive, isOperatorActive])

  const handleOperatorBlur = useDeferredBlur(
    wrapperRef as React.RefObject<HTMLElement>,
    handleInputBlur
  )
  const handleValueBlur = useDeferredBlur(
    wrapperRef as React.RefObject<HTMLElement>,
    handleInputBlur
  )

  const operatorItems = useMemo(
    () =>
      buildOperatorItems(
        { type: 'operator', path },
        rootFilters,
        filterProperties,
        hasTypedOperator
      ),
    [path, rootFilters, filterProperties, hasTypedOperator]
  )

  const valueItems = useMemo(
    () =>
      buildValueItems(
        { type: 'value', path },
        rootFilters,
        filterProperties,
        propertyOptionsCache,
        loadingOptions,
        conditionValue,
        hasTypedValue
      ),
    [
      path,
      rootFilters,
      filterProperties,
      propertyOptionsCache,
      loadingOptions,
      conditionValue,
      hasTypedValue,
    ]
  )

  const customValueItem = useMemo(
    () => valueItems.find((i) => i.isCustom && i.customOption),
    [valueItems]
  )

  // If the value options are only a custom component, open it immediately
  useEffect(() => {
    if (!isActive || isLoading) return
    const hasOnlyCustom = valueItems.length > 0 && valueItems.every((i) => i.isCustom)
    if (hasOnlyCustom && !showValueCustom) {
      setShowValueCustom(true)
    }
  }, [isActive, isLoading, valueItems, showValueCustom])

  const handleOperatorBackspace = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && condition.operator === '') {
        e.preventDefault()
        handleRemoveCondition(path)
        setActiveInput({ type: 'group', path: path.slice(0, -1) })
      }
    },
    [condition.operator, setActiveInput, path, handleRemoveCondition]
  )

  const {
    highlightedIndex: opHighlightedIndex,
    handleKeyDown: handleOperatorKeyDown,
    reset: resetOpHighlight,
  } = useHighlightNavigation(
    operatorItems.length,
    (index) => {
      if (operatorItems[index]) handleSelectMenuItem(operatorItems[index])
    },
    handleOperatorBackspace
  )

  const {
    highlightedIndex: valHighlightedIndex,
    handleKeyDown: handleValueKeyDown,
    reset: resetValHighlight,
  } = useHighlightNavigation(
    valueItems.length,
    (index) => {
      const item = valueItems[index]
      if (!item) return
      if (item.isCustom) {
        setShowValueCustom(true)
      } else {
        handleSelectMenuItem(item)
      }
    },
    handleKeyDown
  )

  useEffect(() => {
    if (!isOperatorActive) resetOpHighlight()
  }, [isOperatorActive, resetOpHighlight])

  useEffect(() => {
    if (!isActive) resetValHighlight()
  }, [isActive, resetValHighlight])

  const onOperatorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasTypedOperator(true)
      handleOperatorChange(path, e.target.value)
    },
    [handleOperatorChange, path]
  )

  const onValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasTypedValue(true)
      setLocalValue(e.target.value)
      handleInputChange(path, e.target.value)
    },
    [handleInputChange, path]
  )

  const onRemove = useCallback(() => {
    handleRemoveCondition(path)
  }, [handleRemoveCondition, path])

  if (!property) return null

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'flex items-stretch px-0 bg-muted group shrink-0',
        variant === 'pill' ? 'rounded border' : 'border-r',
        isHighlighted && 'ring-2 ring-primary'
      )}
      data-testid={`filter-condition-${property.name}`}
      data-highlighted={isHighlighted}
    >
      <span
        className="text-xs pl-2 pr-1 cursor-pointer shrink-0 whitespace-nowrap text-foreground-light h-full flex items-center"
        onClick={() => handleLabelClick(path)}
      >
        {property.label}
      </span>
      <Popover_Shadcn_ open={isOperatorActive && !isLoading && operatorItems.length > 0}>
        <PopoverAnchor_Shadcn_ asChild>
          <div className="relative inline-block">
            <Input_Shadcn_
              ref={operatorRef}
              type="text"
              value={condition.operator}
              onChange={onOperatorChange}
              onFocus={() => handleOperatorFocus(path)}
              onBlur={handleOperatorBlur}
              onKeyDown={handleOperatorKeyDown}
              className="h-full border-none bg-transparent py-0 px-1 text-center text-xs focus:outline-none focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-brand w-full absolute left-0 top-0"
              disabled={isLoading}
              aria-label={`Operator for ${property.label}`}
              data-testid={`filter-operator-${property.name}`}
            />
            <span className="invisible whitespace-pre text-xs block px-1 shrink-0 px-1">
              {condition.operator || ' '}
            </span>
          </div>
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
            items={operatorItems}
            highlightedIndex={opHighlightedIndex}
            onSelect={handleSelectMenuItem}
            includeIcon={false}
            grouped
          />
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
      <Popover_Shadcn_ open={isActive && !isLoading && (showValueCustom || valueItems.length > 0)}>
        <PopoverAnchor_Shadcn_ asChild>
          <div className="relative inline-block max-w-[150px]">
            <Input_Shadcn_
              ref={valueRef}
              type="text"
              value={localValue}
              onChange={onValueChange}
              onFocus={() => handleInputFocus(path)}
              onBlur={handleValueBlur}
              onKeyDown={handleValueKeyDown}
              className="h-full border-none bg-transparent py-0 px-1 text-xs focus:outline-none focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 w-full absolute left-0 top-0"
              disabled={isLoading}
              aria-label={`Value for ${property.label}`}
              data-testid={`filter-value-${property.name}`}
            />
            <span className="invisible whitespace-pre text-xs block px-1">{localValue || ' '}</span>
          </div>
        </PopoverAnchor_Shadcn_>
        <PopoverContent_Shadcn_
          className="min-w-[220px] w-fit p-0"
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
          {showValueCustom && customValueItem && customValueItem.customOption ? (
            customValueItem.customOption({
              onChange: (value: string) => {
                handleInputChange(path, value)
                setShowValueCustom(false)
                setTimeout(() => {
                  setActiveInput({ type: 'group', path: path.slice(0, -1) })
                }, 0)
              },
              onCancel: () => {
                setShowValueCustom(false)
                onRemove()
              },
              search: conditionValue,
            })
          ) : (
            <DefaultCommandList
              items={valueItems}
              highlightedIndex={valHighlightedIndex}
              onSelect={(item) =>
                item.isCustom ? setShowValueCustom(true) : handleSelectMenuItem(item)
              }
              includeIcon
            />
          )}
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
      <Button
        type="text"
        size="tiny"
        icon={
          <X
            strokeWidth={1}
            size={10}
            className="group-hover:text-foreground text-foreground-lighter"
          />
        }
        onClick={onRemove}
        className="group hover:text-foreground hover:!bg-surface-600 rounded-none px-1 h-auto py-0"
        aria-label={`Remove ${property.label} filter`}
        tabIndex={-1}
        data-testid={`filter-remove-${property.name}`}
      />
    </div>
  )
}
