import { useState, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { isEqual } from 'lodash'

/**
 * Hook to handle synchronized state with debounced updates
 * Maintains local editable state while syncing with external state
 *
 * Used in FilterPopoverPrimitive and SortPopoverPrimitive
 *
 * @param externalState The state from the parent component
 * @param onChange Callback to notify parent of changes
 * @param debounceMs Debounce delay in milliseconds
 * @returns [localState, setLocalState, applyChanges]
 */
export function useDebounceSync<T>(
  externalState: T,
  onChange: (state: T) => void,
  debounceMs = 500
) {
  // Local state for editing
  const [internalState, setInternalState] = useState<T>(externalState)

  // When external state changes, update internal state
  useEffect(() => {
    setInternalState(externalState)
  }, [externalState])

  // Debounced handler for changes
  const handleChange = useDebouncedCallback((newState: T) => {
    // Only trigger onChange if values actually differ
    if (!isEqual(newState, externalState)) {
      onChange(newState)
    }
  }, debounceMs)

  return [internalState, setInternalState, handleChange] as const
}
