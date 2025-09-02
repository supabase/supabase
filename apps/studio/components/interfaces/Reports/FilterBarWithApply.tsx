import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from 'ui'
import { FilterBar, type FilterGroup, type FilterProperty } from 'ui-patterns'

interface FilterBarWithApplyProps {
  filterProperties: FilterProperty[]
  filters: FilterGroup
  onFilterChange: (filters: FilterGroup) => void
  freeformText: string
  onFreeformTextChange: (freeformText: string) => void
  onApply?: () => void
  aiApiUrl?: string
  className?: string
}

export function FilterBarWithApply({
  filterProperties,
  filters,
  onFilterChange,
  freeformText,
  onFreeformTextChange,
  onApply,
  aiApiUrl,
  className,
}: FilterBarWithApplyProps) {
  const [pendingFilters, setPendingFilters] = useState<FilterGroup>(filters)
  const [pendingFreeformText, setPendingFreeformText] = useState(freeformText)
  const [hasChanges, setHasChanges] = useState(false)
  const filterBarRef = useRef<HTMLDivElement>(null)

  const hasActiveFilters = filters.conditions.length > 0 || freeformText.trim() !== ''

  useEffect(() => {
    const filtersChanged = JSON.stringify(pendingFilters) !== JSON.stringify(filters)
    const textChanged = pendingFreeformText !== freeformText
    setHasChanges(filtersChanged || textChanged)
  }, [pendingFilters, pendingFreeformText, filters, freeformText])

  // Sync pending state when external filters change
  useEffect(() => {
    setPendingFilters(filters)
  }, [filters])

  useEffect(() => {
    setPendingFreeformText(freeformText)
  }, [freeformText])

  const handleApply = useCallback(async () => {
    onFilterChange(pendingFilters)
    onFreeformTextChange(pendingFreeformText)
    setHasChanges(false)

    // Use setTimeout to ensure state updates are flushed before calling onApply
    setTimeout(() => {
      onApply?.()
    }, 0)
  }, [pendingFilters, pendingFreeformText, onFilterChange, onFreeformTextChange, onApply])

  const handleClear = useCallback(async () => {
    const emptyFilters: FilterGroup = { logicalOperator: 'AND', conditions: [] }
    setPendingFilters(emptyFilters)
    setPendingFreeformText('')
    onFilterChange(emptyFilters)
    onFreeformTextChange('')
    setHasChanges(false)

    // Use setTimeout to ensure state updates are flushed before calling onApply
    setTimeout(() => {
      onApply?.()
    }, 0)
  }, [onFilterChange, onFreeformTextChange, onApply])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (hasChanges) {
          handleApply()
        }
      }
    },
    [hasChanges, handleApply]
  )

  // Add global keyboard listener when FilterBar is focused
  useEffect(() => {
    const filterBarElement = filterBarRef.current
    if (!filterBarElement) return

    const handleFocus = () => {
      document.addEventListener('keydown', handleKeyDown)
    }

    const handleBlur = (e: FocusEvent) => {
      // Only remove listener if focus is moving outside the FilterBar
      if (!filterBarElement.contains(e.relatedTarget as Node)) {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }

    filterBarElement.addEventListener('focusin', handleFocus)
    filterBarElement.addEventListener('focusout', handleBlur)

    return () => {
      filterBarElement.removeEventListener('focusin', handleFocus)
      filterBarElement.removeEventListener('focusout', handleBlur)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <div className="flex items-center gap-2 w-full">
      <div ref={filterBarRef} className="flex-1">
        <FilterBar
          filterProperties={filterProperties}
          filters={pendingFilters}
          onFilterChange={setPendingFilters}
          freeformText={pendingFreeformText}
          onFreeformTextChange={setPendingFreeformText}
          aiApiUrl={aiApiUrl}
          className={className}
        />
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          type="default"
          size="tiny"
          onClick={handleClear}
          disabled={!hasActiveFilters}
          title="Clear all filters"
        >
          Clear
        </Button>
        <Button
          type="primary"
          size="tiny"
          onClick={handleApply}
          disabled={!hasChanges}
          title="Apply filters (⌘+Enter)"
        >
          Apply
        </Button>
      </div>
    </div>
  )
}
