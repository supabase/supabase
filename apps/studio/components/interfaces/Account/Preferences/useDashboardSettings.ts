import { LOCAL_STORAGE_KEYS } from 'common'

import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export const useIsInlineEditorSetting = () => {
  const [inlineEditorEnabled, setInlineEditorEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.UI_PREVIEW_INLINE_EDITOR,
    false
  )

  return {
    inlineEditorEnabled: inlineEditorEnabled ?? false,
    setInlineEditorEnabled,
  }
}

export const useIsQueueOperationsSetting = () => {
  const [isQueueOperationsEnabled, setIsQueueOperationsEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.UI_PREVIEW_QUEUE_OPERATIONS,
    false
  )
  return {
    isQueueOperationsEnabled: isQueueOperationsEnabled ?? false,
    setIsQueueOperationsEnabled,
  }
}

export const useIsShortcutChordHudSetting = () => {
  const [isShortcutChordHudEnabled, setIsShortcutChordHudEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.UI_SHORTCUT_CHORD_HUD,
    true
  )
  return {
    isShortcutChordHudEnabled: isShortcutChordHudEnabled ?? true,
    setIsShortcutChordHudEnabled,
  }
}

export const useIsInlineEditorEnabled = () => {
  const { inlineEditorEnabled } = useIsInlineEditorSetting()
  return inlineEditorEnabled ?? false
}

export const useIsQueueOperationsEnabled = () => {
  const { isQueueOperationsEnabled } = useIsQueueOperationsSetting()
  return isQueueOperationsEnabled ?? false
}

export const useIsShortcutChordHudEnabled = () => {
  const { isShortcutChordHudEnabled } = useIsShortcutChordHudSetting()
  return isShortcutChordHudEnabled ?? true
}
