import { useCallback, useMemo } from 'react'
import { useUrlState } from 'hooks/ui/useUrlState'
// Import the hook for saving to tabs store
import { useSaveColumnVisibilityToTabs } from './useSaveColumnVisibilityToTabs'

// Comma-separated string in URL, Set<string> in hook
const URL_PARAM_KEY = 'hidden_cols'

export function useTableColumnVisibility() {
  const [params, setParams] = useUrlState()
  // Get the function to save to tabs store
  const { saveHiddenColumnsToTab } = useSaveColumnVisibilityToTabs()

  const urlHiddenColumnsString = useMemo(() => {
    const val = params[URL_PARAM_KEY]
    return typeof val === 'string' ? val : ''
  }, [params])

  const hiddenColumnsSet = useMemo(() => {
    return new Set<string>(urlHiddenColumnsString ? urlHiddenColumnsString.split(',') : [])
  }, [urlHiddenColumnsString])

  const setHiddenColumnsUrl = useCallback(
    (newHiddenColumns: Set<string>) => {
      const newUrlString = Array.from(newHiddenColumns).sort().join(',')
      setParams((prevParams) => ({
        ...prevParams,
        [URL_PARAM_KEY]: newUrlString || undefined, // Remove param if empty
      }))
      // Call save to tabs store whenever the whole set changes via URL
      saveHiddenColumnsToTab(newHiddenColumns)
    },
    [setParams, saveHiddenColumnsToTab] // Add saveHiddenColumnsToTab dependency
  )

  // Function to conveniently hide a single column
  const hideColumnUrl = useCallback(
    (columnName: string) => {
      const newSet = new Set(hiddenColumnsSet)
      newSet.add(columnName)
      setHiddenColumnsUrl(newSet) // This will now also trigger saveHiddenColumnsToTab
    },
    [hiddenColumnsSet, setHiddenColumnsUrl]
  )

  // Function to conveniently show a single column
  const showColumnUrl = useCallback(
    (columnName: string) => {
      const newSet = new Set(hiddenColumnsSet)
      newSet.delete(columnName)
      setHiddenColumnsUrl(newSet) // This will now also trigger saveHiddenColumnsToTab
    },
    [hiddenColumnsSet, setHiddenColumnsUrl]
  )

  return {
    hiddenColumns: hiddenColumnsSet, // The current Set<string> of hidden columns from URL
    setHiddenColumnsUrl, // Function to update the URL param with a full Set
    hideColumn: hideColumnUrl, // Function to hide a specific column (updates URL)
    showColumn: showColumnUrl, // Function to show a specific column (updates URL)
  }
}
