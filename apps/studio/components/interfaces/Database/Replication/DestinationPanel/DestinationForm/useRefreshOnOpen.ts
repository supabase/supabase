import { useCallback } from 'react'

// Replication metadata (publication names, publication tables, source tables,
// columns) and similar destination-form option lists follow one rule:
//
// - Opening a picker always refetches.
// - Loading and error UI only appear when there is nothing to show, so a
//   background refresh never replaces existing options with a skeleton.
//
// Pass `isPending || isFetching` into the loading helpers. `isPending` covers
// "query not started yet" (including while a parent id is still loading);
// `isFetching` covers an in-flight request. A populated list stays visible.

export const isMetadataListLoading = (isPendingOrFetching: boolean, itemCount: number) =>
  isPendingOrFetching && itemCount === 0

export const isMetadataListErrorVisible = (isError: boolean, itemCount: number) =>
  isError && itemCount === 0

export const isMetadataValueLoading = (isPendingOrFetching: boolean, value: unknown) =>
  isPendingOrFetching && value == null

interface UseRefreshOnOpenProps {
  isEnabled?: boolean
  refetch: () => unknown
}

export const useRefreshOnOpen = ({ isEnabled = true, refetch }: UseRefreshOnOpenProps) => {
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen && isEnabled) void refetch()
  }, [isEnabled, refetch])

  return { handleOpenChange }
}
