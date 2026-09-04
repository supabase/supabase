import { cn } from 'ui'

import { GenericSelectionSkeletonLoader } from '../ShimmeringLoader'

interface SelectionListStateProps {
  className?: string
  emptyLabel?: string
  errorLabel?: string
  isEmpty?: boolean
  isError?: boolean
  isLoading?: boolean
  skeletonVariant?: 'command' | 'multi-select' | 'select'
}

export const SelectionListState = ({
  className,
  emptyLabel = 'No options available',
  errorLabel = 'Unable to load options',
  isEmpty = false,
  isError = false,
  isLoading = false,
  skeletonVariant = 'select',
}: SelectionListStateProps) => {
  let statusLabel: string | undefined
  if (isLoading) statusLabel = 'Loading options'
  else if (isError) statusLabel = errorLabel
  else if (isEmpty) statusLabel = emptyLabel

  return (
    <>
      {isLoading && (
        <GenericSelectionSkeletonLoader
          className={cn('w-full', className)}
          variant={skeletonVariant}
        />
      )}
      <div
        aria-live="polite"
        className={cn(
          'px-2 py-3 text-xs text-foreground-lighter',
          (isLoading || statusLabel === undefined) && 'sr-only',
          className
        )}
      >
        {statusLabel}
      </div>
    </>
  )
}
