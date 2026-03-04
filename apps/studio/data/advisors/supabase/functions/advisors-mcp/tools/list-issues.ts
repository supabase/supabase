import { sql } from "../../advisors-shared/db.ts";

export const listIssuesTool = {
  name: "listIssues",
  description: "List advisor issues with lifecycle status. Filter by status, severity, or category.",
  parameters: {
    type: "object" as const,
    properties: {
      status: { type: "string", description: "Filter: open, acknowledged, snoozed, resolved, dismissed" },
      severity: { type: "string", description: "Filter: critical, warning, info" },
      category: { type: "string", description: "Filter by category" },
      limit: { type: "number", description: "Max issues (default 20)" },
    },
  },
  execute: async (params: { status?: string; severity?: string; category?: string; limit?: number }) => {
    const limit = params.limit ?? 20;
    let rows;
    if (params.status) {
      rows = await sql`
        SELECT id, title, severity, category, status, alert_count, first_triggered_at, last_triggered_at, suggested_actions
        FROM _supabase_advisors.issues WHERE status = ${params.status}
        ORDER BY last_triggered_at DESC LIMIT ${limit}`;
    } else {
      rows = await sql`
        SELECT id, title, severity, category, status, alert_count, first_triggered_at, last_triggered_at, suggested_actions
        FROM _supabase_advisors.issues
        WHERE status IN ('open', 'acknowledged', 'snoozed')
        ORDER BY last_triggered_at DESC LIMIT ${limit}`;
    }
    if (params.severity) rows = rows.filter((r: any) => r.severity === params.severity);
    if (params.category) rows = rows.filter((r: any) => r.category === params.category);
    return { issues: rows, count: rows.length };
  },
};
