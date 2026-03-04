import { sql } from '../../advisors-shared/db.ts'

export const listAlertsTool = {
  name: 'listAlerts',
  description:
    'List recent alerts from the advisors system. Optionally filter by issue_id or severity.',
  parameters: {
    type: 'object' as const,
    properties: {
      issue_id: { type: 'string', description: 'Filter alerts by issue ID' },
      severity: { type: 'string', description: 'Filter by severity: critical, warning, info' },
      limit: { type: 'number', description: 'Max alerts to return (default 20)' },
    },
  },
  execute: async (params: { issue_id?: string; severity?: string; limit?: number }) => {
    const limit = params.limit ?? 20
    let rows
    if (params.issue_id) {
      rows = await sql`
        SELECT id, rule_id, issue_id, severity, category, title, description, triggered_at
        FROM _supabase_advisors.alerts WHERE issue_id = ${params.issue_id}
        ORDER BY triggered_at DESC LIMIT ${limit}`
    } else if (params.severity) {
      rows = await sql`
        SELECT id, rule_id, issue_id, severity, category, title, description, triggered_at
        FROM _supabase_advisors.alerts WHERE severity = ${params.severity}
        ORDER BY triggered_at DESC LIMIT ${limit}`
    } else {
      rows = await sql`
        SELECT id, rule_id, issue_id, severity, category, title, description, triggered_at
        FROM _supabase_advisors.alerts ORDER BY triggered_at DESC LIMIT ${limit}`
    }
    return { alerts: rows, count: rows.length }
  },
}
