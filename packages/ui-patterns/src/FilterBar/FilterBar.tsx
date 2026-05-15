'use client'

import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import React, { forwardRef } from 'react'
import { cn } from 'ui'

import {
  FilterBarHandle,
  FilterBarRoot,
  useFilterBar,
  type FilterBarVariant,
} from './FilterBarContext'
import { FilterGroup } from './FilterGroup'
import { FilterBarAction, FilterGroup as FilterGroupType, FilterProperty } from './types'

export type FilterBarProps = {
  filterProperties: FilterProperty[]
  freeformText: string
  filters: FilterGroupType
  actions?: FilterBarAction[]
  isLoading?: boolean
  className?: string
  supportsOperators?: boolean
  variant?: FilterBarVariant
  icon?: React.ReactNode
  onFilterChange: (filters: FilterGroupType) => void
  onFreeformTextChange: (freeformText: string) => void
}

function FilterBarContent({ className }: { className?: string }) {
  const {
    filters,
    error,
    optionsError,
    isLoading,
    variant,
    icon: loadingIcon,
    handleGroupFreeformFocus,
  } = useFilterBar()

  return (
    <div className="w-full space-y-2 relative">
      <div
        className={cn(
          'relative flex items-stretch gap-0 w-full border rounded-md h-full bg-foreground/[.026] cursor-text p-0 pr-2 overflow-auto',
          className
        )}
      >
        <div
          className={cn(
            'relative flex items-center justify-center shrink-0 px-2 bg-surface-200',
            variant === 'pill' ? 'bg-transparent border-r-0' : 'border-r',
            !isLoading && 'cursor-pointer'
          )}
          onClick={() => !isLoading && handleGroupFreeformFocus([])}
        >
          <div
            className={cn(
              'transition-opacity duration-300 ease-in-out',
              loadingIcon ? 'opacity-0' : 'opacity-100'
            )}
          >
            <Search className="text-foreground-muted w-4 h-4 sticky" />
          </div>
          {loadingIcon && (
            <div className="absolute inset-0 flex items-center justify-center">{loadingIcon}</div>
          )}
        </div>
        <motion.div
          className="flex-1 flex flex-wrap items-stretch gap-0"
          animate={{ opacity: isLoading ? 0.5 : 1 }}
          transition={{
            duration: 1,
            repeat: isLoading ? Infinity : 0,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        >
          <FilterGroup group={filters} path={[]} />
        </motion.div>
      </div>
      {(error || optionsError) && (
        <div className="text-red-500 text-xs mt-1">{error || optionsError}</div>
      )}
    </div>
  )
}

/**
 * FilterBar - A composable filter bar component
 *
 * Simple usage:
 * ```tsx
 * <FilterBar
 *   filterProperties={filterProperties}
 *   filters={filters}
 *   onFilterChange={setFilters}
 *   freeformText={freeformText}
 *   onFreeformTextChange={setFreeformText}
 * />
 * ```
 *
 * Composable usage:
 * ```tsx
 * <FilterBar.Root
 *   filterProperties={filterProperties}
 *   filters={filters}
 *   onFilterChange={setFilters}
 *   freeformText={freeformText}
 *   onFreeformTextChange={setFreeformText}
 * >
 *   <FilterBar.Content />
 * </FilterBar.Root>
 * ```
 */
export const FilterBar = forwardRef<FilterBarHandle, FilterBarProps>(function FilterBar(
  {
    filterProperties,
    filters,
    onFilterChange,
    freeformText,
    onFreeformTextChange,
    actions,
    isLoading,
    className,
    supportsOperators = false,
    variant = 'default',
    icon,
  },
  ref
) {
  return (
    <FilterBarRoot
      ref={ref}
      filterProperties={filterProperties}
      filters={filters}
      onFilterChange={onFilterChange}
      freeformText={freeformText}
      onFreeformTextChange={onFreeformTextChange}
      actions={actions}
      isLoading={isLoading}
      supportsOperators={supportsOperators}
      variant={variant}
      icon={icon}
    >
      <FilterBarContent className={className} />
    </FilterBarRoot>
  )
})

// Composable API exports
Object.assign(FilterBar, {
  Root: FilterBarRoot,
  Content: FilterBarContent,
  Group: FilterGroup,
})
