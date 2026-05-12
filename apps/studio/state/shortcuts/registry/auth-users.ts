import { RegistryDefinations } from '../types'

export const AUTH_USERS_SHORTCUT_IDS = {
  AUTH_USERS_REFRESH: 'auth-users.refresh',
  AUTH_USERS_CLEAR_SORT: 'auth-users.clear-sort',
  AUTH_USERS_TOGGLE_ALL_SELECTION: 'auth-users.toggle-all-selection',
  AUTH_USERS_DELETE_SELECTED: 'auth-users.delete-selected',
  AUTH_USERS_EXIT_SELECTION: 'auth-users.exit-selection',
  AUTH_USERS_CLOSE_PANEL: 'auth-users.close-panel',
  AUTH_USERS_START_NAV_DOWN: 'auth-users.start-nav-down',
  AUTH_USERS_START_NAV_UP: 'auth-users.start-nav-up',
  AUTH_USERS_CREATE_USER: 'auth-users.create-user',
  AUTH_USERS_INVITE_USER: 'auth-users.invite-user',
}

export type AuthUsersShortcutId =
  (typeof AUTH_USERS_SHORTCUT_IDS)[keyof typeof AUTH_USERS_SHORTCUT_IDS]

export const authUsersRegistry: RegistryDefinations<AuthUsersShortcutId> = {
  [AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_REFRESH]: {
    id: AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_REFRESH,
    label: 'Refresh users',
    sequence: ['Shift+R'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_CLEAR_SORT]: {
    id: AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_CLEAR_SORT,
    label: 'Clear sort',
    sequence: ['S', 'C'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_TOGGLE_ALL_SELECTION]: {
    id: AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_TOGGLE_ALL_SELECTION,
    label: 'Toggle selection on all displayed users',
    sequence: ['Mod+A'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_DELETE_SELECTED]: {
    id: AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_DELETE_SELECTED,
    label: 'Delete selected users',
    sequence: ['Mod+Backspace'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_EXIT_SELECTION]: {
    id: AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_EXIT_SELECTION,
    label: 'Clear user selection',
    sequence: ['Escape'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_CLOSE_PANEL]: {
    id: AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_CLOSE_PANEL,
    label: 'Close user details panel',
    sequence: ['Escape'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_START_NAV_DOWN]: {
    id: AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_START_NAV_DOWN,
    label: 'Move focus into users grid',
    sequence: ['ArrowDown'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_START_NAV_UP]: {
    id: AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_START_NAV_UP,
    label: 'Move focus into users grid',
    sequence: ['ArrowUp'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_CREATE_USER]: {
    id: AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_CREATE_USER,
    label: 'Create new user',
    sequence: ['I', 'U'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_INVITE_USER]: {
    id: AUTH_USERS_SHORTCUT_IDS.AUTH_USERS_INVITE_USER,
    label: 'Send user invitation',
    sequence: ['I', 'I'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
