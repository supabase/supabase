import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { ActiveInput } from './hooks'
import { X } from 'lucide-react'
import {
  Button,
  Input_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverAnchor_Shadcn_,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
} from 'ui'
import { buildOperatorItems, buildValueItems, MenuItem } from './menuItems'
import { FilterGroup as FilterGroupType } from './types'
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
  const [opHighlightedIndex, setOpHighlightedIndex] = useState(0)
  const [valHighlightedIndex, setValHighlightedIndex] = useState(0)
  const [showValueCustom, setShowValueCustom] = useState(false)

  useEffect(() => {
    if (isActive && valueRef.current) {
      valueRef.current.focus()
    } else if (isOperatorActive && operatorRef.current) {
      operatorRef.current.focus()
    }
  }, [isActive, isOperatorActive])

  useEffect(() => {
    if (!isOperatorActive) setOpHighlightedIndex(0)
  }, [isOperatorActive])
  useEffect(() => {
    if (!isActive) setValHighlightedIndex(0)
  }, [isActive])

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

  useEffect(() => {
    if (opHighlightedIndex > operatorItems.length - 1) {
      setOpHighlightedIndex(operatorItems.length > 0 ? operatorItems.length - 1 : 0)
    }
  }, [operatorItems, opHighlightedIndex])

  useEffect(() => {
    if (valHighlightedIndex > valueItems.length - 1) {
      setValHighlightedIndex(valueItems.length > 0 ? valueItems.length - 1 : 0)
    }
  }, [valueItems, valHighlightedIndex])

  const handleOperatorKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setOpHighlightedIndex((prev) => (prev < operatorItems.length - 1 ? prev + 1 : prev))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setOpHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (operatorItems[opHighlightedIndex]) onSelectMenuItem(operatorItems[opHighlightedIndex])
        return
      }
    },
    [operatorItems, opHighlightedIndex, onSelectMenuItem]
  )

  const handleValueKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setValHighlightedIndex((prev) => (prev < valueItems.length - 1 ? prev + 1 : prev))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setValHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (valueItems[valHighlightedIndex]) {
          const item = valueItems[valHighlightedIndex]
          if (item.isCustom) {
            setShowValueCustom(true)
          } else {
            onSelectMenuItem(item)
          }
        }
        return
      }
      onKeyDown(e)
    },
    [valueItems, valHighlightedIndex, onKeyDown, onSelectMenuItem]
  )

  const handleOperatorBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      // Defer to allow focus to land in popover content/custom component
      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null
        if (active && wrapperRef.current && wrapperRef.current.contains(active)) {
          return
        }
        onBlur()
      }, 0)
    },
    [onBlur]
  )

  const handleValueBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null
        if (active && wrapperRef.current && wrapperRef.current.contains(active)) {
          return
        }
        onBlur()
      }, 0)
    },
    [onBlur]
  )

  return (
    <div ref={wrapperRef} className="flex items-center rounded px-2 h-6 bg-surface-400 group">
      <span className="text-xs font-medium mr-1 font-mono cursor-pointer" onClick={onLabelClick}>
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
            className="border-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono h-6 mr-1 text-foreground-light"
            style={{
              width: `${Math.max(condition.operator.length, 1)}ch`,
              minWidth: '1ch',
            }}
            disabled={isLoading}
            aria-label={`Operator for ${property.label}`}
          />
        </PopoverAnchor_Shadcn_>
        <PopoverContent_Shadcn_
          className="w-[220px] p-0"
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
          <Command_Shadcn_>
            <CommandList_Shadcn_>
              <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                {operatorItems.map((item, idx) => (
                  <CommandItem_Shadcn_
                    key={`${item.value}-${item.label}`}
                    value={item.value}
                    onSelect={() => onSelectMenuItem(item)}
                    className={`text-xs font-mono ${idx === opHighlightedIndex ? 'bg-surface-400' : ''}`}
                  >
                    {item.label}
                  </CommandItem_Shadcn_>
                ))}
              </CommandGroup_Shadcn_>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
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
            className="border-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono h-6 mr-1"
            style={{
              width: `${Math.max((condition.value ?? '').toString().length, 1)}ch`,
              minWidth: '1ch',
            }}
            disabled={isLoading}
            aria-label={`Value for ${property.label}`}
          />
        </PopoverAnchor_Shadcn_>
        <PopoverContent_Shadcn_
          className="w-[260px] p-0"
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
            <Command_Shadcn_>
              <CommandList_Shadcn_>
                <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
                <CommandGroup_Shadcn_>
                  {valueItems.map((item, idx) => (
                    <CommandItem_Shadcn_
                      key={`${item.value}-${item.label}`}
                      value={item.value}
                      onSelect={() =>
                        item.isCustom ? setShowValueCustom(true) : onSelectMenuItem(item)
                      }
                      className={`text-xs font-mono ${idx === valHighlightedIndex ? 'bg-surface-400' : ''}`}
                    >
                      {item.icon}
                      {item.label}
                    </CommandItem_Shadcn_>
                  ))}
                </CommandGroup_Shadcn_>
              </CommandList_Shadcn_>
            </Command_Shadcn_>
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
