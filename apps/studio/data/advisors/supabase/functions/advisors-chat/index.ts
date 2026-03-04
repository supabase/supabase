import { openai } from "npm:@ai-sdk/openai@1";
import {
  convertToModelMessages,
  createIdGenerator,
  stepCountIs,
  streamText,
  type UIMessage,
} from "npm:ai@4";
import { sql } from "../advisors-shared/db.ts";
import { corsHeaders } from "../advisors-shared/cors.ts";

const generateMessageId = createIdGenerator({ prefix: "msg" });
const S = "_supabase_advisors";

type ChatRequestBody = {
  message?: unknown;
  model?: string;
  agent_id?: string;
  conversation_id?: string;
  task_id?: string;
  issue_id?: string;
  list_tools?: boolean;
  persist?: boolean;
};

type Agent = {
  id: string;
  name: string;
  summary: string | null;
  system_prompt: string | null;
  tools: string[];
};

function isUIMessageLike(value: unknown): value is UIMessage {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return typeof c.id === "string" && typeof c.role === "string" && Array.isArray(c.parts);
}

function dbRowToUIMessage(row: any): UIMessage {
  return {
    id: row.id,
    role: row.role,
    parts: Array.isArray(row.parts) ? row.parts : [],
    createdAt: new Date(row.created_at),
  } as UIMessage;
}

async function loadAgent(agentId: string): Promise<Agent | null> {
  const [row] = await sql`SELECT * FROM _supabase_advisors.agents WHERE id = ${agentId}`;
  return row ?? null;
}

async function loadConversationHistory(conversationId: string): Promise<UIMessage[]> {
  const rows = await sql`
    SELECT id, role, parts, created_at FROM _supabase_advisors.conversation_messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC`;
  return rows.map(dbRowToUIMessage);
}

function buildSystemPrompt(agent: Agent | null): string {
  const base = `You are an AI advisor for a Supabase project. You help users understand and fix issues with their database, security, and performance.

When analyzing alerts or issues:
1. Explain what the issue means in plain language
2. Assess the severity and potential impact
3. Provide specific, actionable recommendations
4. Include SQL statements when applicable

Available context: You have access to tools that let you query alerts, issues, logs, and disk utilization.`;

  if (agent?.system_prompt) {
    return `${agent.system_prompt}\n\n${base}`;
  }
  return base;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: ChatRequestBody = await req.json();
    const {
      message,
      model: modelName,
      agent_id,
      conversation_id,
      task_id,
      issue_id,
      list_tools,
      persist = true,
    } = body;

    const noStream = req.headers.get("x-internal-no-stream") === "1";

    // Load agent configuration
    let agent: Agent | null = null;
    if (agent_id) {
      agent = await loadAgent(agent_id);
    }

    // Determine model
    const modelId = modelName ?? "gpt-4o";
    const model = openai(modelId);

    // Load conversation history
    let messages: UIMessage[] = [];
    if (conversation_id) {
      messages = await loadConversationHistory(conversation_id);
    }

    // Add the new message
    if (message && isUIMessageLike(message)) {
      messages.push(message as UIMessage);
    }

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure conversation exists
    let convId = conversation_id;
    if (persist && convId) {
      const [existing] = await sql`
        SELECT id FROM _supabase_advisors.conversations WHERE id = ${convId}`;
      if (!existing) {
        await sql`
          INSERT INTO _supabase_advisors.conversations (id, issue_id, task_id, title)
          VALUES (${convId}, ${issue_id ?? null}, ${task_id ?? null}, 'Advisor Chat')`;
      }
    }

    // Persist the user message
    if (persist && convId && message && isUIMessageLike(message)) {
      const msg = message as UIMessage;
      await sql`
        INSERT INTO _supabase_advisors.conversation_messages (id, conversation_id, agent_id, task_id, role, parts)
        VALUES (${msg.id}, ${convId}, ${agent_id ?? null}, ${task_id ?? null}, ${msg.role}, ${JSON.stringify(msg.parts)})
        ON CONFLICT (id) DO NOTHING`;
    }

    const systemPrompt = buildSystemPrompt(agent);

    const result = streamText({
      model,
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      maxSteps: 5,
      stopWhen: stepCountIs(5),
    });

    if (noStream) {
      const response = await result;
      const text = await response.text;
      const assistantMessageId = generateMessageId();

      if (persist && convId) {
        const parts = [{ type: "text", text }];
        await sql`
          INSERT INTO _supabase_advisors.conversation_messages (id, conversation_id, agent_id, task_id, role, parts)
          VALUES (${assistantMessageId}, ${convId}, ${agent_id ?? null}, ${task_id ?? null}, 'assistant', ${JSON.stringify(parts)})`;
      }

      return new Response(JSON.stringify({ id: assistantMessageId, text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream response
    const stream = result.toDataStream({
      sendReasoning: true,
      getErrorMessage: (error) => {
        if (error instanceof Error) return error.message;
        return "An error occurred";
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
