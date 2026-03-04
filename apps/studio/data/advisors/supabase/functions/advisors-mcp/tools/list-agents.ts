import { sql } from "../../advisors-shared/db.ts";

export const listAgentsTool = {
  name: "listAgents",
  description: "List all configured AI advisor agents.",
  parameters: { type: "object" as const, properties: {} },
  execute: async () => {
    const rows = await sql`SELECT id, name, summary, tools FROM _supabase_advisors.agents ORDER BY name`;
    return { agents: rows, count: rows.length };
  },
};
