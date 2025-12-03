'use client'

import { X } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
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
}

export function FilterCondition({
  condition,
  path,
  isActive,
  isOperatorActive,
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
  } = useFilterBar()

  const operatorRef = useRef<HTMLInputElement>(null)
  const valueRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const property = filterProperties.find((p) => p.name === condition.propertyName)
  const [showValueCustom, setShowValueCustom] = useState(false)
  const [hasTypedOperator, setHasTypedOperator] = useState(false)
  const [hasTypedValue, setHasTypedValue] = useState(false)

  // Reset "has typed" state when focus changes
  useEffect(() => {
    if (!isOperatorActive) {
      setHasTypedOperator(false)
    }
  }, [isOperatorActive])

  useEffect(() => {
    if (!isActive) {
      setHasTypedValue(false)
    }
  }, [isActive])

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
        (condition.value ?? '').toString(),
        hasTypedValue
      ),
    [
      path,
      rootFilters,
      filterProperties,
      propertyOptionsCache,
      loadingOptions,
      condition.value,
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

  const {
    highlightedIndex: opHighlightedIndex,
    handleKeyDown: handleOperatorKeyDown,
    reset: resetOpHighlight,
  } = useHighlightNavigation(operatorItems.length, (index) => {
    if (operatorItems[index]) handleSelectMenuItem(operatorItems[index])
  })

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
      className="flex items-center rounded px-2 h-6 bg-muted border group shrink-0"
    >
      <span
        className="text-xs mr-1 cursor-pointer shrink-0 whitespace-nowrap text-foreground-light"
        onClick={() => handleLabelClick(path)}
      >
        {property.label}
      </span>
      <Popover_Shadcn_ open={isOperatorActive && !isLoading && operatorItems.length > 0}>
        <PopoverAnchor_Shadcn_ asChild>
          <div className="relative inline-block mr-1">
            <Input_Shadcn_
              ref={operatorRef}
              type="text"
              value={condition.operator}
              onChange={onOperatorChange}
              onFocus={() => handleOperatorFocus(path)}
              onBlur={handleOperatorBlur}
              onKeyDown={handleOperatorKeyDown}
              className="border-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-6 text-foreground-light w-full absolute left-0 top-0"
              disabled={isLoading}
              aria-label={`Operator for ${property.label}`}
            />
            <span className="invisible whitespace-pre text-xs block h-6">
              {condition.operator || ' '}
            </span>
          </div>
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
            items={operatorItems}
            highlightedIndex={opHighlightedIndex}
            onSelect={handleSelectMenuItem}
            includeIcon={false}
          />
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
      <Popover_Shadcn_ open={isActive && !isLoading && (showValueCustom || valueItems.length > 0)}>
        <PopoverAnchor_Shadcn_ asChild>
          <div className="relative inline-block mr-1 max-w-[150px]">
            <Input_Shadcn_
              ref={valueRef}
              type="text"
              value={(condition.value ?? '').toString()}
              onChange={onValueChange}
              onFocus={() => handleInputFocus(path)}
              onBlur={handleValueBlur}
              onKeyDown={handleValueKeyDown}
              className="border-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-6 w-full absolute left-0 top-0"
              disabled={isLoading}
              aria-label={`Value for ${property.label}`}
            />
            <span className="invisible whitespace-pre text-xs block h-6">
              {(condition.value ?? '').toString() || ' '}
            </span>
          </div>
        </PopoverAnchor_Shadcn_>
        <PopoverContent_Shadcn_
          className="min-w-[220px] w-fit p-0"
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
              search: (condition.value ?? '').toString(),
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
            strokeWidth={1.5}
            size={12}
            className="group-hover:text-foreground text-foreground-light"
          />
        }
        onClick={onRemove}
        className="group hover:text-foreground !hover:bg-surface-600 p-0"
        aria-label={`Remove ${property.label} filter`}
      />
    </div>
  )
}
