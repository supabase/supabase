import type { AuditLog } from '@/data/organizations/organization-audit-logs-query'

export function sortAuditLogs(logs: AuditLog[], descending: boolean): AuditLog[] {
  return [...logs].sort((a, b) =>
    descending ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
  )
}

export function filterByProjects(logs: AuditLog[], projectRefs: string[]): AuditLog[] {
  if (projectRefs.length === 0) return logs
  return logs.filter((log) => projectRefs.includes(log.project_ref ?? ''))
}
