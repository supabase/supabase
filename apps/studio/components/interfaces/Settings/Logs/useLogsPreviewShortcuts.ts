import type { RefObject } from 'react'

import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface UseLogsPreviewShortcutsParams {
  searchInputRef: RefObject<HTMLInputElement | null>
  hasSearch: boolean
  onResetSearch: () => void
  onRefresh: () => void
  onToggleChart: () => void
  onLoadOlder: () => void
  canLoadOlder: boolean
}

/**
 * Toolbar-level shortcuts for the LogsPreviewer (search focus, reset filters,
 * refresh, toggle histogram, load older). Grid-level shortcuts (selection,
 * arrow navigation, escape) live alongside the grid in LogTable.
 *
 * Mounted once inside LogsPreviewer so the shortcuts auto-activate on every
 * consumer of the component (function logs, function invocations, logs
 * explorer).
 */
export function useLogsPreviewShortcuts({
  searchInputRef,
  hasSearch,
  onResetSearch,
  onRefresh,
  onToggleChart,
  onLoadOlder,
  canLoadOlder,
}: UseLogsPreviewShortcutsParams) {
  useShortcut(
    SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH,
    () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    },
    { label: 'Search logs' }
  )

  useShortcut(SHORTCUT_IDS.LIST_PAGE_RESET_FILTERS, onResetSearch, {
    enabled: hasSearch,
  })

  useShortcut(SHORTCUT_IDS.LOGS_PREVIEW_REFRESH, onRefresh)

  useShortcut(SHORTCUT_IDS.LOGS_PREVIEW_TOGGLE_CHART, onToggleChart)

  useShortcut(SHORTCUT_IDS.LOGS_PREVIEW_LOAD_OLDER, onLoadOlder, { enabled: canLoadOlder })
}
