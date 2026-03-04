import { sql } from "../../advisors-shared/db.ts";

export const listTasksTool = {
  name: "listTasks",
  description: "List scheduled agent tasks.",
  parameters: {
    type: "object" as const,
    properties: {
      agent_id: { type: "string", description: "Filter by agent ID" },
    },
  },
  execute: async (params: { agent_id?: string }) => {
    let rows;
    if (params.agent_id) {
      rows = await sql`
        SELECT * FROM _supabase_advisors.agent_tasks WHERE agent_id = ${params.agent_id} ORDER BY name`;
    } else {
      rows = await sql`SELECT * FROM _supabase_advisors.agent_tasks ORDER BY name`;
    }
    return { tasks: rows, count: rows.length };
  },
};
