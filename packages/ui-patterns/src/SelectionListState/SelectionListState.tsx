import { cn } from 'ui'

import { GenericSelectionSkeletonLoader } from '../ShimmeringLoader'

interface SelectionListStateProps {
  className?: string
  empty?: boolean
  emptyLabel?: string
  error?: boolean
  errorLabel?: string
  loading?: boolean
  skeletonVariant?: 'command' | 'multi-select' | 'select'
}

export const SelectionListState = ({
  className,
  empty = false,
  emptyLabel = 'No options available',
  error = false,
  errorLabel = 'Unable to load options',
  loading = false,
  skeletonVariant = 'select',
}: SelectionListStateProps) => {
  let statusLabel: string | undefined
  if (!loading && error) statusLabel = errorLabel
  if (!loading && !error && empty) statusLabel = emptyLabel

  return (
    <>
      {loading && (
        <GenericSelectionSkeletonLoader
          className={cn('w-full', className)}
          variant={skeletonVariant}
        />
      )}
      <div
        aria-live="polite"
        className={cn(
          'px-2 py-3 text-xs text-foreground-lighter',
          statusLabel === undefined && 'sr-only',
          className
        )}
      >
        {statusLabel}
      </div>
    </>
  )
}
