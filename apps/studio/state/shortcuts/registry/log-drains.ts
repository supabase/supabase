import { RegistryDefinations } from '../types'

export const LOG_DRAINS_SHORTCUT_IDS = {
  LOG_DRAINS_ADD_DESTINATION: 'log-drains.add-destination',
  LOG_DRAINS_SAVE_DESTINATION: 'log-drains.save-destination',
}

export type LogDrainsShortcutId =
  (typeof LOG_DRAINS_SHORTCUT_IDS)[keyof typeof LOG_DRAINS_SHORTCUT_IDS]

export const logDrainsRegistry: RegistryDefinations<LogDrainsShortcutId> = {
  [LOG_DRAINS_SHORTCUT_IDS.LOG_DRAINS_ADD_DESTINATION]: {
    id: LOG_DRAINS_SHORTCUT_IDS.LOG_DRAINS_ADD_DESTINATION,
    label: 'Add destination',
    sequence: ['Shift+N'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [LOG_DRAINS_SHORTCUT_IDS.LOG_DRAINS_SAVE_DESTINATION]: {
    id: LOG_DRAINS_SHORTCUT_IDS.LOG_DRAINS_SAVE_DESTINATION,
    label: 'Save destination',
    sequence: ['Mod+Enter'],
    showInSettings: false,
  },
}
