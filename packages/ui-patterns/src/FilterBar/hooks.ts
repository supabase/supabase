'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { FilterProperty, FilterOptionObject, AsyncOptionsFunction } from './types'
import { isAsyncOptionsFunction } from './utils'

export type ActiveInput =
  | { type: 'value'; path: number[] }
  | { type: 'operator'; path: number[] }
  | { type: 'group'; path: number[] }
  | null

export function useFilterBarState() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const [isCommandMenuVisible, setIsCommandMenuVisible] = useState(false)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [activeInput, setActiveInput] = useState<ActiveInput>(null)
  const newPathRef = useRef<number[]>([])
  const [dialogContent, setDialogContent] = useState<React.ReactElement | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [pendingPath, setPendingPath] = useState<number[] | null>(null)

  const resetState = useCallback(() => {
    setError(null)
    setSelectedCommandIndex(0)
    setIsCommandMenuVisible(false)
    setActiveInput(null)
    setDialogContent(null)
    setIsDialogOpen(false)
    setPendingPath(null)
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
  }, [])

  return {
    isLoading,
    setIsLoading,
    error,
    setError,
    selectedCommandIndex,
    setSelectedCommandIndex,
    isCommandMenuVisible,
    setIsCommandMenuVisible,
    hideTimeoutRef,
    activeInput,
    setActiveInput,
    newPathRef,
    dialogContent,
    setDialogContent,
    isDialogOpen,
    setIsDialogOpen,
    pendingPath,
    setPendingPath,
    resetState,
  }
}

export function useOptionsCache() {
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({})
  const [propertyOptionsCache, setPropertyOptionsCache] = useState<
    Record<string, { options: (string | FilterOptionObject)[]; searchValue: string }>
  >({})
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadPropertyOptions = useCallback(
    async (property: FilterProperty, search: string = '') => {
      if (
        !property.options ||
        Array.isArray(property.options) ||
        !isAsyncOptionsFunction(property.options)
      ) {
        return
      }

      const cached = propertyOptionsCache[property.name]
      if (cached && cached.searchValue === search) return

      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }

      loadTimeoutRef.current = setTimeout(async () => {
        if (loadingOptions[property.name]) return

        try {
          setLoadingOptions((prev) => ({ ...prev, [property.name]: true }))
          const asyncOptions = property.options as AsyncOptionsFunction
          const rawOptions = await asyncOptions(search)
          const options = rawOptions.map((option: string | FilterOptionObject) =>
            typeof option === 'string' ? { label: option, value: option } : option
          )
          setPropertyOptionsCache((prev) => ({
            ...prev,
            [property.name]: { options, searchValue: search },
          }))
        } catch (error) {
          console.error(`Error loading options for ${property.name}:`, error)
          setOptionsError(`Failed to load options for ${property.label}`)
        } finally {
          setLoadingOptions((prev) => ({ ...prev, [property.name]: false }))
        }
      }, 300)
    },
    [loadingOptions, propertyOptionsCache]
  )

  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
    }
  }, [])

  return {
    loadingOptions,
    propertyOptionsCache,
    loadPropertyOptions,
    optionsError,
    setOptionsError,
  }
}

// Shared utilities
export function useDeferredBlur(wrapperRef: React.RefObject<HTMLElement>, onBlur: () => void) {
  return useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null
        if (active && wrapperRef.current && wrapperRef.current.contains(active)) {
          return
        }
        // Check if the active element is within a popover
        if (active && active.closest('[data-radix-popper-content-wrapper]')) {
          return
        }
        onBlur()
      }, 0)
    },
    [wrapperRef, onBlur]
  )
}

export function useHighlightNavigation(
  itemsLength: number,
  onEnter: (index: number) => void,
  fallbackKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
) {
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  useEffect(() => {
    if (highlightedIndex > itemsLength - 1) {
      setHighlightedIndex(itemsLength > 0 ? itemsLength - 1 : 0)
    }
  }, [itemsLength, highlightedIndex])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < itemsLength - 1 ? prev + 1 : prev))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        onEnter(highlightedIndex)
        return
      }
      if (fallbackKeyDown) fallbackKeyDown(e)
    },
    [itemsLength, highlightedIndex, onEnter, fallbackKeyDown]
  )

  const reset = useCallback(() => setHighlightedIndex(0), [])

  return { highlightedIndex, setHighlightedIndex, handleKeyDown, reset }
}
