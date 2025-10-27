import { LOCAL_STORAGE_KEYS } from 'common'
import { useLocalStorageQuery } from './useLocalStorage'

/**
 * Hook to check if inline editor is enabled.
 * Returns true by default.
 *
 * When enabled, users can edit policies, triggers, and functions directly
 * in a side panel using SQL. When disabled, they use the AI-assisted form editor.
 */
export const useIsInlineEditorEnabled = () => {
  const [inlineEditorEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.UI_PREVIEW_INLINE_EDITOR,
    true
  )

  return inlineEditorEnabled ?? true
}
