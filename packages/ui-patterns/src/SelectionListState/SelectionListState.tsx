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
  if (loading) {
    return (
      <GenericSelectionSkeletonLoader
        className={cn('w-full', className)}
        variant={skeletonVariant}
      />
    )
  }

  if (!error && !empty) return null

  return (
    <div className={cn('px-2 py-3 text-xs text-foreground-lighter', className)}>
      {error ? errorLabel : emptyLabel}
    </div>
  )
}
