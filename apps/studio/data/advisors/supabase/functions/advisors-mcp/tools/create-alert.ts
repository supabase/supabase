import { sql } from "../../advisors-shared/db.ts";

export const createAlertTool = {
  name: "createAlert",
  description: "Create a new alert and optionally link it to an issue.",
  parameters: {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "Alert title" },
      description: { type: "string", description: "Alert description" },
      severity: { type: "string", description: "critical, warning, or info" },
      category: { type: "string", description: "Alert category" },
      issue_id: { type: "string", description: "Link to an existing issue" },
    },
    required: ["title", "severity"],
  },
  execute: async (params: {
    title: string;
    description?: string;
    severity: string;
    category?: string;
    issue_id?: string;
  }) => {
    const [alert] = await sql`
      INSERT INTO _supabase_advisors.alerts (title, description, severity, category, issue_id)
      VALUES (${params.title}, ${params.description ?? null}, ${params.severity},
              ${params.category ?? "general"}, ${params.issue_id ?? null})
      RETURNING *`;
    return alert;
  },
};
