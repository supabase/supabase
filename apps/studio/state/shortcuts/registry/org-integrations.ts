import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

export const ORG_INTEGRATIONS_SHORTCUT_IDS = {
  ORG_INTEGRATIONS_ADD_CONNECTION: 'org.integrations-add-connection',
} as const

export type OrgIntegrationsShortcutId =
  (typeof ORG_INTEGRATIONS_SHORTCUT_IDS)[keyof typeof ORG_INTEGRATIONS_SHORTCUT_IDS]

export const orgIntegrationsRegistry: RegistryDefinations<OrgIntegrationsShortcutId> = {
  [ORG_INTEGRATIONS_SHORTCUT_IDS.ORG_INTEGRATIONS_ADD_CONNECTION]: {
    id: ORG_INTEGRATIONS_SHORTCUT_IDS.ORG_INTEGRATIONS_ADD_CONNECTION,
    label: 'Add project connection',
    sequence: ['Shift+N'],
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.ORG_INTEGRATIONS,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
