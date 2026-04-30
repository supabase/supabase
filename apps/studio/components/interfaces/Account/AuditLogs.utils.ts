import type { V2AuditLog } from '@/data/organizations/organization-audit-logs-query'

export function sortAuditLogs(logs: V2AuditLog[], descending: boolean): V2AuditLog[] {
  return [...logs].sort((a, b) =>
    descending ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
  )
}

export function filterByProjects(logs: V2AuditLog[], projectRefs: string[]): V2AuditLog[] {
  if (projectRefs.length === 0) return logs
  return logs.filter((log) => projectRefs.includes(log.project_ref ?? ''))
}
