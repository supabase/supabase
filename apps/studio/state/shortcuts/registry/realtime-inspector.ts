import { RegistryDefinations } from '../types'

/**
 * Shortcuts scoped to the Realtime Inspector page.
 *
 * Active only while the inspector is mounted. All use `Shift+<letter>` to
 * avoid conflicting with the global `Mod+` shortcuts and the multi-step nav
 * chords.
 */
export const REALTIME_INSPECTOR_SHORTCUT_IDS = {
  INSPECTOR_JOIN_CHANNEL: 'realtime-inspector.join-channel',
  INSPECTOR_TOGGLE_LISTENING: 'realtime-inspector.toggle-listening',
  INSPECTOR_TOGGLE_FILTERS: 'realtime-inspector.toggle-filters',
  INSPECTOR_BROADCAST: 'realtime-inspector.broadcast',
  INSPECTOR_COPY_MESSAGE: 'realtime-inspector.copy-message',
}

export type RealtimeInspectorShortcutId =
  (typeof REALTIME_INSPECTOR_SHORTCUT_IDS)[keyof typeof REALTIME_INSPECTOR_SHORTCUT_IDS]

export const realtimeInspectorRegistry: RegistryDefinations<RealtimeInspectorShortcutId> = {
  [REALTIME_INSPECTOR_SHORTCUT_IDS.INSPECTOR_JOIN_CHANNEL]: {
    id: REALTIME_INSPECTOR_SHORTCUT_IDS.INSPECTOR_JOIN_CHANNEL,
    label: 'Join a channel',
    sequence: ['Shift+J'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [REALTIME_INSPECTOR_SHORTCUT_IDS.INSPECTOR_TOGGLE_LISTENING]: {
    id: REALTIME_INSPECTOR_SHORTCUT_IDS.INSPECTOR_TOGGLE_LISTENING,
    label: 'Start/Stop listening',
    sequence: ['Shift+L'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [REALTIME_INSPECTOR_SHORTCUT_IDS.INSPECTOR_TOGGLE_FILTERS]: {
    id: REALTIME_INSPECTOR_SHORTCUT_IDS.INSPECTOR_TOGGLE_FILTERS,
    label: 'Toggle filters',
    sequence: ['Shift+F'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [REALTIME_INSPECTOR_SHORTCUT_IDS.INSPECTOR_BROADCAST]: {
    id: REALTIME_INSPECTOR_SHORTCUT_IDS.INSPECTOR_BROADCAST,
    label: 'Broadcast a message',
    sequence: ['Shift+B'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [REALTIME_INSPECTOR_SHORTCUT_IDS.INSPECTOR_COPY_MESSAGE]: {
    id: REALTIME_INSPECTOR_SHORTCUT_IDS.INSPECTOR_COPY_MESSAGE,
    label: 'Copy selected message',
    sequence: ['Mod+Shift+C'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
