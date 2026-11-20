import { RegistryDefinations } from '../types'

export const JWT_KEYS_SHORTCUT_IDS = {
  JWT_KEYS_CREATE_STANDBY: 'jwt-keys.create-standby',
  JWT_KEYS_SUBMIT_STANDBY: 'jwt-keys.submit-standby',
}

export type JwtKeysShortcutId = (typeof JWT_KEYS_SHORTCUT_IDS)[keyof typeof JWT_KEYS_SHORTCUT_IDS]

export const jwtKeysRegistry: RegistryDefinations<JwtKeysShortcutId> = {
  [JWT_KEYS_SHORTCUT_IDS.JWT_KEYS_CREATE_STANDBY]: {
    id: JWT_KEYS_SHORTCUT_IDS.JWT_KEYS_CREATE_STANDBY,
    label: 'Create standby key',
    sequence: ['Shift+N'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [JWT_KEYS_SHORTCUT_IDS.JWT_KEYS_SUBMIT_STANDBY]: {
    id: JWT_KEYS_SHORTCUT_IDS.JWT_KEYS_SUBMIT_STANDBY,
    label: 'Create standby key',
    sequence: ['Mod+Enter'],
    showInSettings: false,
  },
}
