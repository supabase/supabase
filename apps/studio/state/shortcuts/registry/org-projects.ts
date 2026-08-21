import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

export const ORG_PROJECTS_SHORTCUT_IDS = {
  ORG_PROJECTS_NEW: 'org.projects-new',
  ORG_PROJECTS_SEARCH: 'org.projects-search',
} as const

export type OrgProjectsShortcutId =
  (typeof ORG_PROJECTS_SHORTCUT_IDS)[keyof typeof ORG_PROJECTS_SHORTCUT_IDS]

export const orgProjectsRegistry: RegistryDefinations<OrgProjectsShortcutId> = {
  [ORG_PROJECTS_SHORTCUT_IDS.ORG_PROJECTS_NEW]: {
    id: ORG_PROJECTS_SHORTCUT_IDS.ORG_PROJECTS_NEW,
    label: 'New project',
    sequence: ['Shift+N'],
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.ORG_PROJECTS,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [ORG_PROJECTS_SHORTCUT_IDS.ORG_PROJECTS_SEARCH]: {
    id: ORG_PROJECTS_SHORTCUT_IDS.ORG_PROJECTS_SEARCH,
    label: 'Search projects',
    sequence: ['Shift+F'],
    showInSettings: false,
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.ORG_PROJECTS,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
