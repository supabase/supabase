import type { AuditLog } from '@/data/organizations/organization-audit-logs-query'

export function filterByProjects(logs: AuditLog[], projectRefs: string[]): AuditLog[] {
  if (projectRefs.length === 0) return logs
  return logs.filter((log) => projectRefs.includes(log.project_ref ?? ''))
}
