import { useEffect } from 'react'

import { LOCAL_STORAGE_KEYS } from 'common'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useLocalStorageQuery } from './useLocalStorage'

const LEGACY_INLINE_EDITOR_HOTKEY_KEY = 'supabase-dashboard-hotkey-inline-editor'

/**
 * Migrates the inline editor hotkey preference to the new sidebar editor panel key.
 * Runs when idle (or within 5 seconds) to avoid blocking render.
 */
const useLegacyInlineEditorHotkeyMigration = () => {
  const [_inlineEditorEnabled, setInlineEditorEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_SIDEBAR(SIDEBAR_KEYS.EDITOR_PANEL),
    true
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const migrate = () => {
      try {
        const legacyValue = window.localStorage.getItem(LEGACY_INLINE_EDITOR_HOTKEY_KEY)

        if (legacyValue !== null) {
          setInlineEditorEnabled(legacyValue === 'true')
          window.localStorage.removeItem(LEGACY_INLINE_EDITOR_HOTKEY_KEY)
        }
      } catch (error) {
        console.warn('Failed to migrate inline editor hotkey preference', error)
      }
    }

    if (typeof window.requestIdleCallback === 'function') {
      const idleCallbackId = window.requestIdleCallback(migrate, { timeout: 5000 })
      return () => window.cancelIdleCallback?.(idleCallbackId)
    }

    const timeoutId = window.setTimeout(migrate, 5000)
    return () => window.clearTimeout(timeoutId)
  }, [setInlineEditorEnabled])
}

export const LegacyInlineEditorHotkeyMigration = () => {
  useLegacyInlineEditorHotkeyMigration()
  return null
}
