import { SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { RegistryDefinations } from '../types'

export const ORG_AUDIT_LOGS_SHORTCUT_IDS = {
  ORG_AUDIT_LOGS_REFRESH: 'org.audit-logs-refresh',
} as const

export type OrgAuditLogsShortcutId =
  (typeof ORG_AUDIT_LOGS_SHORTCUT_IDS)[keyof typeof ORG_AUDIT_LOGS_SHORTCUT_IDS]

export const orgAuditLogsRegistry: RegistryDefinations<OrgAuditLogsShortcutId> = {
  [ORG_AUDIT_LOGS_SHORTCUT_IDS.ORG_AUDIT_LOGS_REFRESH]: {
    id: ORG_AUDIT_LOGS_SHORTCUT_IDS.ORG_AUDIT_LOGS_REFRESH,
    label: 'Refresh audit logs',
    sequence: ['Shift+R'],
    referenceGroup: SHORTCUT_REFERENCE_GROUPS.ORG_AUDIT_LOGS,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
