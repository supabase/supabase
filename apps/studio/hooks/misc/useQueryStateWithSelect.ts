import { parseAsString, useQueryState } from 'nuqs'
import { MutableRefObject, useEffect, useMemo } from 'react'
import { toast } from 'sonner'

/**
 * Hook for managing URL query parameters with a custom select function and error handling.
 *
 * @param enabled - Whether error handling is active (shows error when selectedId exists but select returns undefined)
 * @param urlKey - The query parameter key (e.g., 'edit', 'delete')
 * @param select - Function to transform the selected ID into the desired value (returns undefined if not found)
 * @param onError - Callback invoked when enabled is true and selectedId exists but select returns undefined
 *
 * @returns Object with:
 *   - value: The result of select(selectedId) or undefined
 *   - setValue: Function to set/clear the selected ID in the URL
 */
export function useQueryStateWithSelect<T>({
  enabled,
  urlKey,
  select,
  onError,
}: {
  enabled: boolean
  urlKey: string
  select: (id: string) => T | undefined
  onError: (error: Error, selectedId: string) => void
}) {
  const [selectedId, setSelectedId] = useQueryState(
    urlKey,
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )

  const value = useMemo(() => (selectedId ? select(selectedId) : undefined), [selectedId, select])

  useEffect(() => {
    if (enabled && selectedId && !value) {
      onError(new Error(`not found`), selectedId)
      setSelectedId(null)
    }
  }, [enabled, onError, selectedId, setSelectedId, value])

  return {
    value,
    setValue: setSelectedId as (value: string | null) => void,
  }
}

export const handleErrorOnDelete = (
  deletingIdRef: MutableRefObject<string | null>,
  selectedId: string,
  errorMessage: string
) => {
  if (selectedId !== deletingIdRef.current) {
    toast.error(errorMessage)
  } else {
    deletingIdRef.current = null
  }
}
