import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

export const ORG_OAUTH_APPS_SHORTCUT_IDS = {
  ORG_OAUTH_APPS_PUBLISH: 'org.oauth-apps-publish',
  ORG_OAUTH_APPS_SUBMIT: 'org.oauth-apps-submit',
} as const

export type OrgOAuthAppsShortcutId =
  (typeof ORG_OAUTH_APPS_SHORTCUT_IDS)[keyof typeof ORG_OAUTH_APPS_SHORTCUT_IDS]

export const orgOAuthAppsRegistry: RegistryDefinations<OrgOAuthAppsShortcutId> = {
  [ORG_OAUTH_APPS_SHORTCUT_IDS.ORG_OAUTH_APPS_PUBLISH]: {
    id: ORG_OAUTH_APPS_SHORTCUT_IDS.ORG_OAUTH_APPS_PUBLISH,
    label: 'Publish OAuth app',
    sequence: ['Shift+N'],
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.ORG_OAUTH_APPS,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [ORG_OAUTH_APPS_SHORTCUT_IDS.ORG_OAUTH_APPS_SUBMIT]: {
    id: ORG_OAUTH_APPS_SHORTCUT_IDS.ORG_OAUTH_APPS_SUBMIT,
    label: 'Confirm OAuth app',
    sequence: ['Mod+Enter'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.ORG_OAUTH_APPS,
  },
}
