import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

/**
 * Contextual chords for jumping between Project Settings pages — `S + <letter>`.
 *
 * Active only while SettingsLayout is mounted. External settings-adjacent routes
 * such as Data API, Vault, Subscription, and Usage intentionally stay out of
 * this group.
 */
export const PROJECT_SETTINGS_NAV_SHORTCUT_IDS = {
  NAV_PROJECT_SETTINGS_GENERAL: 'nav.project-settings-general',
  NAV_PROJECT_SETTINGS_COMPUTE_AND_DISK: 'nav.project-settings-compute-and-disk',
  NAV_PROJECT_SETTINGS_INFRASTRUCTURE: 'nav.project-settings-infrastructure',
  NAV_PROJECT_SETTINGS_INTEGRATIONS: 'nav.project-settings-integrations',
  NAV_PROJECT_SETTINGS_WEBHOOKS: 'nav.project-settings-webhooks',
  NAV_PROJECT_SETTINGS_API_KEYS: 'nav.project-settings-api-keys',
  NAV_PROJECT_SETTINGS_JWT_KEYS: 'nav.project-settings-jwt-keys',
  NAV_PROJECT_SETTINGS_LOG_DRAINS: 'nav.project-settings-log-drains',
  NAV_PROJECT_SETTINGS_ADDONS: 'nav.project-settings-addons',
  NAV_PROJECT_SETTINGS_DASHBOARD: 'nav.project-settings-dashboard',
}

export type ProjectSettingsNavShortcutId =
  (typeof PROJECT_SETTINGS_NAV_SHORTCUT_IDS)[keyof typeof PROJECT_SETTINGS_NAV_SHORTCUT_IDS]

export const projectSettingsNavRegistry: RegistryDefinations<ProjectSettingsNavShortcutId> = {
  [PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_GENERAL]: {
    id: PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_GENERAL,
    label: 'Go to General',
    sequence: ['S', 'G'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_PROJECT_SETTINGS,
  },
  [PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_COMPUTE_AND_DISK]: {
    id: PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_COMPUTE_AND_DISK,
    label: 'Go to Compute and Disk',
    sequence: ['S', 'C'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_PROJECT_SETTINGS,
  },
  [PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_INFRASTRUCTURE]: {
    id: PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_INFRASTRUCTURE,
    label: 'Go to Infrastructure',
    sequence: ['S', 'I'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_PROJECT_SETTINGS,
  },
  [PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_INTEGRATIONS]: {
    id: PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_INTEGRATIONS,
    label: 'Go to Integrations',
    sequence: ['S', 'N'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_PROJECT_SETTINGS,
  },
  [PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_WEBHOOKS]: {
    id: PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_WEBHOOKS,
    label: 'Go to Webhooks',
    sequence: ['S', 'W'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_PROJECT_SETTINGS,
  },
  [PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_API_KEYS]: {
    id: PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_API_KEYS,
    label: 'Go to API Keys',
    sequence: ['S', 'K'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_PROJECT_SETTINGS,
  },
  [PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_JWT_KEYS]: {
    id: PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_JWT_KEYS,
    label: 'Go to JWT Keys',
    sequence: ['S', 'J'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_PROJECT_SETTINGS,
  },
  [PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_LOG_DRAINS]: {
    id: PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_LOG_DRAINS,
    label: 'Go to Log Drains',
    sequence: ['S', 'L'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_PROJECT_SETTINGS,
  },
  [PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_ADDONS]: {
    id: PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_ADDONS,
    label: 'Go to Add-ons',
    sequence: ['S', 'A'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_PROJECT_SETTINGS,
  },
  [PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_DASHBOARD]: {
    id: PROJECT_SETTINGS_NAV_SHORTCUT_IDS.NAV_PROJECT_SETTINGS_DASHBOARD,
    label: 'Go to Dashboard',
    sequence: ['S', 'D'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_PROJECT_SETTINGS,
  },
}
