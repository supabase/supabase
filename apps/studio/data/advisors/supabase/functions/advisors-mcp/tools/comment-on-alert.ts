import { sql } from "../../advisors-shared/db.ts";

export const commentOnAlertTool = {
  name: "commentOnAlert",
  description: "Add a comment or analysis to an issue's conversation.",
  parameters: {
    type: "object" as const,
    properties: {
      issue_id: { type: "string", description: "The issue ID to comment on" },
      content: { type: "string", description: "The comment content" },
    },
    required: ["issue_id", "content"],
  },
  execute: async (params: { issue_id: string; content: string }) => {
    let [conv] = await sql`
      SELECT id FROM _supabase_advisors.conversations
      WHERE issue_id = ${params.issue_id}
      ORDER BY created_at DESC LIMIT 1`;

    if (!conv) {
      [conv] = await sql`
        INSERT INTO _supabase_advisors.conversations (issue_id, title)
        VALUES (${params.issue_id}, 'Agent Analysis')
        RETURNING id`;
    }

    const msgId = `msg-${crypto.randomUUID().replace(/-/g, "")}`;
    const parts = JSON.stringify([{ type: "text", text: params.content }]);

    await sql`
      INSERT INTO _supabase_advisors.conversation_messages (id, conversation_id, role, parts)
      VALUES (${msgId}, ${conv.id}, 'assistant', ${parts})`;

    return { success: true, conversation_id: conv.id, message_id: msgId };
  },
};
