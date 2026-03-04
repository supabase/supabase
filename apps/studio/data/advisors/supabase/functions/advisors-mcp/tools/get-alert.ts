import { sql } from "../../advisors-shared/db.ts";

export const getAlertTool = {
  name: "getAlert",
  description: "Get detailed information about a specific alert by ID.",
  parameters: {
    type: "object" as const,
    properties: {
      alert_id: { type: "string", description: "The alert ID" },
    },
    required: ["alert_id"],
  },
  execute: async (params: { alert_id: string }) => {
    const [alert] = await sql`
      SELECT * FROM _supabase_advisors.alerts WHERE id = ${params.alert_id}`;
    if (!alert) return { error: "Alert not found" };
    return alert;
  },
};
