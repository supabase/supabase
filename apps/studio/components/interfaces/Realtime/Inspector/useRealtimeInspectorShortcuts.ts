import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface UseRealtimeInspectorShortcutsParams {
  hasChannel: boolean
  isListening: boolean
  onJoinChannel: () => void
  onToggleListening: () => void
  onToggleFilters: () => void
  onBroadcast: () => void
}

/**
 * Registers shortcuts scoped to the Realtime Inspector page:
 *   - Shift+J: open the join-channel popover
 *   - Shift+L: start/stop listening
 *   - Shift+F: open the filter popover
 *   - Shift+B: open the broadcast message modal
 *
 * Should be mounted once at the RealtimeInspector component level.
 */
export function useRealtimeInspectorShortcuts({
  hasChannel,
  isListening,
  onJoinChannel,
  onToggleListening,
  onToggleFilters,
  onBroadcast,
}: UseRealtimeInspectorShortcutsParams) {
  useShortcut(SHORTCUT_IDS.INSPECTOR_JOIN_CHANNEL, onJoinChannel, {
    enabled: !hasChannel,
  })

  useShortcut(SHORTCUT_IDS.INSPECTOR_TOGGLE_LISTENING, onToggleListening, {
    enabled: hasChannel,
  })

  useShortcut(SHORTCUT_IDS.INSPECTOR_TOGGLE_FILTERS, onToggleFilters, {
    enabled: hasChannel,
  })

  useShortcut(SHORTCUT_IDS.INSPECTOR_BROADCAST, onBroadcast, {
    enabled: isListening,
  })
}
