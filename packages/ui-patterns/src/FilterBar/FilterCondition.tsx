import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { ActiveInput } from './hooks'
import { X } from 'lucide-react'
import {
  Button,
  Input_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverAnchor_Shadcn_,
} from 'ui'
import { buildOperatorItems, buildValueItems, MenuItem } from './menuItems'
import { FilterGroup as FilterGroupType } from './types'
import { FilterCondition as FilterConditionType, FilterProperty } from './types'
import { useDeferredBlur, useHighlightNavigation } from './hooks'
import { DefaultCommandList } from './DefaultCommandList'

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
  onRemove: () => void
  // Local context
  rootFilters: FilterGroupType
  path: number[]
  propertyOptionsCache: Record<string, { options: any[]; searchValue: string }>
  loadingOptions: Record<string, boolean>
  aiApiUrl?: string
  onSelectMenuItem: (item: MenuItem) => void
  setActiveInput: (input: ActiveInput) => void
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
  onRemove,
  rootFilters,
  path,
  propertyOptionsCache,
  loadingOptions,
  aiApiUrl,
  onSelectMenuItem,
  setActiveInput,
}: FilterConditionProps) {
  const operatorRef = useRef<HTMLInputElement>(null)
  const valueRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const property = filterProperties.find((p) => p.name === condition.propertyName)
  const [showValueCustom, setShowValueCustom] = useState(false)

  useEffect(() => {
    if (isActive && valueRef.current) {
      valueRef.current.focus()
    } else if (isOperatorActive && operatorRef.current) {
      operatorRef.current.focus()
    }
  }, [isActive, isOperatorActive])

  const handleOperatorBlur = useDeferredBlur(wrapperRef as React.RefObject<HTMLElement>, onBlur)
  const handleValueBlur = useDeferredBlur(wrapperRef as React.RefObject<HTMLElement>, onBlur)

  if (!property) return null

  const operatorItems = useMemo(
    () => buildOperatorItems({ type: 'operator', path } as any, rootFilters, filterProperties),
    [path, rootFilters, filterProperties]
  )

  const valueItems = useMemo(
    () =>
      buildValueItems(
        { type: 'value', path } as any,
        rootFilters,
        filterProperties,
        propertyOptionsCache,
        loadingOptions,
        (condition.value ?? '').toString()
      ),
    [path, rootFilters, filterProperties, propertyOptionsCache, loadingOptions, condition.value]
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
    if (operatorItems[index]) onSelectMenuItem(operatorItems[index])
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
        onSelectMenuItem(item)
      }
    },
    onKeyDown
  )

  useEffect(() => {
    if (!isOperatorActive) resetOpHighlight()
  }, [isOperatorActive, resetOpHighlight])
  useEffect(() => {
    if (!isActive) resetValHighlight()
  }, [isActive, resetValHighlight])

  return (
    <div
      ref={wrapperRef}
      className="flex items-center rounded px-2 h-6 bg-muted border group shrink-0"
    >
      <span
        className="text-xs font-medium mr-1 cursor-pointer shrink-0 whitespace-nowrap"
        onClick={onLabelClick}
      >
        {property.label}
      </span>
      <Popover_Shadcn_ open={isOperatorActive && !isLoading && operatorItems.length > 0}>
        <PopoverAnchor_Shadcn_ asChild>
          <Input_Shadcn_
            ref={operatorRef}
            type="text"
            value={condition.operator}
            onChange={(e) => onOperatorChange(e.target.value)}
            onFocus={onOperatorFocus}
            onBlur={handleOperatorBlur}
            onKeyDown={handleOperatorKeyDown}
            className="border-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-6 mr-1 text-foreground-light"
            style={{
              width: `${Math.max(condition.operator.length, 1)}ch`,
              minWidth: '1ch',
            }}
            disabled={isLoading}
            aria-label={`Operator for ${property.label}`}
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
            items={operatorItems}
            highlightedIndex={opHighlightedIndex}
            onSelect={onSelectMenuItem}
            includeIcon={false}
          />
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
      <Popover_Shadcn_ open={isActive && !isLoading && (showValueCustom || valueItems.length > 0)}>
        <PopoverAnchor_Shadcn_ asChild>
          <Input_Shadcn_
            ref={valueRef}
            type="text"
            value={(condition.value ?? '').toString()}
            onChange={(e) => onValueChange(e.target.value)}
            onFocus={onValueFocus}
            onBlur={handleValueBlur}
            onKeyDown={handleValueKeyDown}
            className="border-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-6 mr-1"
            style={{
              width: `${Math.max((condition.value ?? '').toString().length, 1)}ch`,
              minWidth: '1ch',
            }}
            disabled={isLoading}
            aria-label={`Value for ${property.label}`}
          />
        </PopoverAnchor_Shadcn_>
        <PopoverContent_Shadcn_
          className="min-w-[220px] w-fit p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            const target = e.target as Node
            if (wrapperRef.current && !wrapperRef.current.contains(target)) {
              onBlur()
            }
          }}
        >
          {showValueCustom && customValueItem && customValueItem.customOption ? (
            customValueItem.customOption({
              onChange: (value: string) => {
                onValueChange(value)
                setShowValueCustom(false)
                // Return focus to group's freeform after selection in next tick
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
                item.isCustom ? setShowValueCustom(true) : onSelectMenuItem(item)
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
