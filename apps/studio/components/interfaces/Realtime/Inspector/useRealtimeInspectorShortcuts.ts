import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface UseRealtimeInspectorShortcutsParams {
  hasChannel: boolean
  isListening: boolean
  onJoinChannel: () => void
  onToggleFilters: () => void
  onBroadcast: () => void
}

/**
 * Registers shortcuts scoped to the Realtime Inspector page:
 *   - Shift+J: open the join-channel popover
 *   - Shift+F: open the filter popover
 *   - Shift+B: open the broadcast message modal
 *
 * The Shift+L (toggle listening) shortcut is registered inside the Header
 * component so it shares the start/stop handler — including temp-API-key
 * refresh, permission gating, and telemetry — with the button click.
 *
 * Should be mounted once at the RealtimeInspector component level.
 */
export function useRealtimeInspectorShortcuts({
  hasChannel,
  isListening,
  onJoinChannel,
  onToggleFilters,
  onBroadcast,
}: UseRealtimeInspectorShortcutsParams) {
  useShortcut(SHORTCUT_IDS.INSPECTOR_JOIN_CHANNEL, onJoinChannel, {
    enabled: !hasChannel,
  })

  useShortcut(SHORTCUT_IDS.INSPECTOR_TOGGLE_FILTERS, onToggleFilters, {
    enabled: hasChannel,
  })

  useShortcut(SHORTCUT_IDS.INSPECTOR_BROADCAST, onBroadcast, {
    enabled: isListening,
  })
}
