import { RegistryDefinations } from '../types'

export const API_KEYS_SHORTCUT_IDS = {
  API_KEYS_NEW_PUBLISHABLE: 'api-keys.new-publishable',
  API_KEYS_NEW_SECRET: 'api-keys.new-secret',
  API_KEYS_CREATE_PUBLISHABLE: 'api-keys.create-publishable',
  API_KEYS_CREATE_SECRET: 'api-keys.create-secret',
}

export type ApiKeysShortcutId = (typeof API_KEYS_SHORTCUT_IDS)[keyof typeof API_KEYS_SHORTCUT_IDS]

export const apiKeysRegistry: RegistryDefinations<ApiKeysShortcutId> = {
  [API_KEYS_SHORTCUT_IDS.API_KEYS_NEW_PUBLISHABLE]: {
    id: API_KEYS_SHORTCUT_IDS.API_KEYS_NEW_PUBLISHABLE,
    label: 'New publishable key',
    sequence: ['Shift+P'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [API_KEYS_SHORTCUT_IDS.API_KEYS_NEW_SECRET]: {
    id: API_KEYS_SHORTCUT_IDS.API_KEYS_NEW_SECRET,
    label: 'New secret key',
    sequence: ['Shift+S'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [API_KEYS_SHORTCUT_IDS.API_KEYS_CREATE_PUBLISHABLE]: {
    id: API_KEYS_SHORTCUT_IDS.API_KEYS_CREATE_PUBLISHABLE,
    label: 'Create publishable key',
    sequence: ['Mod+Enter'],
    showInSettings: false,
  },
  [API_KEYS_SHORTCUT_IDS.API_KEYS_CREATE_SECRET]: {
    id: API_KEYS_SHORTCUT_IDS.API_KEYS_CREATE_SECRET,
    label: 'Create secret key',
    sequence: ['Mod+Enter'],
    showInSettings: false,
  },
}
