import { RegistryDefinations } from '../types'

export const EXPLORER_SHORTCUT_IDS = {
  EXPLORER_NOTEBOOK_SAVE: 'explorer.notebook-save',
}

export type ExplorerShortcutId = (typeof EXPLORER_SHORTCUT_IDS)[keyof typeof EXPLORER_SHORTCUT_IDS]

export const explorerRegistry: RegistryDefinations<ExplorerShortcutId> = {
  [EXPLORER_SHORTCUT_IDS.EXPLORER_NOTEBOOK_SAVE]: {
    id: EXPLORER_SHORTCUT_IDS.EXPLORER_NOTEBOOK_SAVE,
    label: 'Save notebook',
    sequence: ['Mod+S'],
    showInSettings: false,
  },
}
