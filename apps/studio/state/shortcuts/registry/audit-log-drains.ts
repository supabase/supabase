import { RegistryDefinations } from '../types'

export const AUDIT_LOG_DRAINS_SHORTCUT_IDS = {
  AUDIT_LOG_DRAINS_ADD_DESTINATION: 'audit-log-drains.add-destination',
  AUDIT_LOG_DRAINS_SAVE_DESTINATION: 'audit-log-drains.save-destination',
}

export type AuditLogDrainsShortcutId =
  (typeof AUDIT_LOG_DRAINS_SHORTCUT_IDS)[keyof typeof AUDIT_LOG_DRAINS_SHORTCUT_IDS]

export const auditLogDrainsRegistry: RegistryDefinations<AuditLogDrainsShortcutId> = {
  [AUDIT_LOG_DRAINS_SHORTCUT_IDS.AUDIT_LOG_DRAINS_ADD_DESTINATION]: {
    id: AUDIT_LOG_DRAINS_SHORTCUT_IDS.AUDIT_LOG_DRAINS_ADD_DESTINATION,
    label: 'Add destination',
    sequence: ['Shift+N'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [AUDIT_LOG_DRAINS_SHORTCUT_IDS.AUDIT_LOG_DRAINS_SAVE_DESTINATION]: {
    id: AUDIT_LOG_DRAINS_SHORTCUT_IDS.AUDIT_LOG_DRAINS_SAVE_DESTINATION,
    label: 'Save destination',
    sequence: ['Mod+Enter'],
    showInSettings: false,
  },
}
