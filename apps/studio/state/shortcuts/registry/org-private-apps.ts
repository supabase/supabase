import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

export const ORG_PRIVATE_APPS_SHORTCUT_IDS = {
  ORG_PRIVATE_APPS_CREATE: 'org.private-apps-create',
} as const

export type OrgPrivateAppsShortcutId =
  (typeof ORG_PRIVATE_APPS_SHORTCUT_IDS)[keyof typeof ORG_PRIVATE_APPS_SHORTCUT_IDS]

export const orgPrivateAppsRegistry: RegistryDefinations<OrgPrivateAppsShortcutId> = {
  [ORG_PRIVATE_APPS_SHORTCUT_IDS.ORG_PRIVATE_APPS_CREATE]: {
    id: ORG_PRIVATE_APPS_SHORTCUT_IDS.ORG_PRIVATE_APPS_CREATE,
    label: 'Create private app',
    sequence: ['Shift+N'],
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.ORG_PRIVATE_APPS,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
