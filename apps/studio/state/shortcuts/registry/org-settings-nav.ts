import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

/**
 * Contextual chords for jumping between Organization Settings sub-pages — `S + <letter>`.
 *
 * Active only while OrganizationSettingsLayout is mounted (i.e. the user is somewhere
 * under `/org/<slug>/general|security|sso|apps|...`). Mirrors the project-settings
 * pattern: `S` for Settings, scoped to the layout so it doesn't burn a global key.
 */
export const ORG_SETTINGS_NAV_SHORTCUT_IDS = {
  NAV_ORG_SETTINGS_GENERAL: 'nav.org-settings-general',
  NAV_ORG_SETTINGS_SECURITY: 'nav.org-settings-security',
  NAV_ORG_SETTINGS_SSO: 'nav.org-settings-sso',
  NAV_ORG_SETTINGS_APPS: 'nav.org-settings-apps',
  NAV_ORG_SETTINGS_PRIVATE_APPS: 'nav.org-settings-private-apps',
  NAV_ORG_SETTINGS_WEBHOOKS: 'nav.org-settings-webhooks',
  NAV_ORG_SETTINGS_AUDIT: 'nav.org-settings-audit',
  NAV_ORG_SETTINGS_AUDIT_LOG_DRAINS: 'nav.org-settings-audit-log-drains',
  NAV_ORG_SETTINGS_DOCUMENTS: 'nav.org-settings-documents',
} as const

export type OrgSettingsNavShortcutId =
  (typeof ORG_SETTINGS_NAV_SHORTCUT_IDS)[keyof typeof ORG_SETTINGS_NAV_SHORTCUT_IDS]

export const orgSettingsNavRegistry: RegistryDefinations<OrgSettingsNavShortcutId> = {
  [ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_GENERAL]: {
    id: ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_GENERAL,
    label: 'Go to General',
    sequence: ['S', 'G'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ORG_SETTINGS,
    options: { ignoreInputs: true },
  },
  [ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_SECURITY]: {
    id: ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_SECURITY,
    label: 'Go to Security',
    sequence: ['S', 'C'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ORG_SETTINGS,
    options: { ignoreInputs: true },
  },
  [ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_SSO]: {
    id: ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_SSO,
    label: 'Go to SSO',
    sequence: ['S', 'S'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ORG_SETTINGS,
    options: { ignoreInputs: true },
  },
  [ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_APPS]: {
    id: ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_APPS,
    label: 'Go to OAuth apps',
    sequence: ['S', 'A'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ORG_SETTINGS,
    options: { ignoreInputs: true },
  },
  [ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_PRIVATE_APPS]: {
    id: ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_PRIVATE_APPS,
    label: 'Go to Private apps',
    sequence: ['S', 'P'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ORG_SETTINGS,
    options: { ignoreInputs: true },
  },
  [ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_WEBHOOKS]: {
    id: ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_WEBHOOKS,
    label: 'Go to Webhooks',
    sequence: ['S', 'W'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ORG_SETTINGS,
    options: { ignoreInputs: true },
  },
  [ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_AUDIT]: {
    id: ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_AUDIT,
    label: 'Go to Audit logs',
    sequence: ['S', 'L'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ORG_SETTINGS,
    options: { ignoreInputs: true },
  },
  [ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_AUDIT_LOG_DRAINS]: {
    id: ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_AUDIT_LOG_DRAINS,
    label: 'Go to Audit log drains',
    sequence: ['S', 'N'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ORG_SETTINGS,
    options: { ignoreInputs: true },
  },
  [ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_DOCUMENTS]: {
    id: ORG_SETTINGS_NAV_SHORTCUT_IDS.NAV_ORG_SETTINGS_DOCUMENTS,
    label: 'Go to Legal documents',
    sequence: ['S', 'D'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ORG_SETTINGS,
    options: { ignoreInputs: true },
  },
}
