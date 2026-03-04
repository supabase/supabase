import { Hono } from "npm:hono@4";
import { sql } from "../advisors-shared/db.ts";
import { corsHeaders } from "../advisors-shared/cors.ts";

const app = new Hono();
const api = new Hono();

const S = "_supabase_advisors";

api.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  await next();
});

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

api.get("/rules", async (c) => {
  const category = c.req.query("category");
  const is_system = c.req.query("is_system");
  try {
    let rows;
    if (category && is_system !== undefined) {
      rows = await sql`
        SELECT * FROM _supabase_advisors.rules
        WHERE category = ${category} AND is_system = ${is_system === "true"}
        ORDER BY is_system DESC, title`;
    } else if (category) {
      rows = await sql`
        SELECT * FROM _supabase_advisors.rules
        WHERE category = ${category}
        ORDER BY is_system DESC, title`;
    } else if (is_system !== undefined) {
      rows = await sql`
        SELECT * FROM _supabase_advisors.rules
        WHERE is_system = ${is_system === "true"}
        ORDER BY is_system DESC, title`;
    } else {
      rows =
        await sql`SELECT * FROM _supabase_advisors.rules ORDER BY is_system DESC, title`;
    }
    return c.json(rows, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.get("/rules/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const [row] =
      await sql`SELECT * FROM _supabase_advisors.rules WHERE id = ${id}`;
    if (!row)
      return c.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
    return c.json(row, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.post("/rules", async (c) => {
  const body = await c.req.json();
  try {
    const [row] = await sql`
      INSERT INTO _supabase_advisors.rules (
        name, title, description, category, source, severity, level,
        schedule, cooldown_seconds, is_system, is_enabled, default_message,
        remediation, sql_query, edge_function_name, api_endpoint, metadata
      ) VALUES (
        ${body.name}, ${body.title}, ${body.description ?? ""},
        ${body.category ?? "general"}, ${body.source ?? "sql"},
        ${body.severity ?? "warning"}, ${body.level ?? "WARN"},
        ${body.schedule ?? "0 */6 * * *"}, ${body.cooldown_seconds ?? 3600},
        ${body.is_system ?? false}, ${body.is_enabled ?? true},
        ${body.default_message ?? null}, ${body.remediation ?? null},
        ${body.sql_query ?? null}, ${body.edge_function_name ?? null},
        ${body.api_endpoint ?? null}, ${JSON.stringify(body.metadata ?? {})}
      ) RETURNING *`;
    return c.json(row, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.patch("/rules/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  try {
    const [existing] =
      await sql`SELECT * FROM _supabase_advisors.rules WHERE id = ${id}`;
    if (!existing)
      return c.json({ error: "Not found" }, { status: 404, headers: corsHeaders });

    const [row] = await sql`
      UPDATE _supabase_advisors.rules SET
        name = ${body.name ?? existing.name},
        title = ${body.title ?? existing.title},
        description = ${body.description ?? existing.description},
        category = ${body.category ?? existing.category},
        severity = ${body.severity ?? existing.severity},
        level = ${body.level ?? existing.level},
        schedule = ${body.schedule ?? existing.schedule},
        cooldown_seconds = ${body.cooldown_seconds ?? existing.cooldown_seconds},
        is_enabled = ${body.is_enabled ?? existing.is_enabled},
        default_message = ${body.default_message ?? existing.default_message},
        remediation = ${body.remediation ?? existing.remediation},
        sql_query = ${body.sql_query ?? existing.sql_query},
        edge_function_name = ${body.edge_function_name ?? existing.edge_function_name},
        api_endpoint = ${body.api_endpoint ?? existing.api_endpoint}
      WHERE id = ${id} RETURNING *`;
    return c.json(row, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.delete("/rules/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const [existing] =
      await sql`SELECT is_system FROM _supabase_advisors.rules WHERE id = ${id}`;
    if (!existing)
      return c.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
    if (existing.is_system)
      return c.json(
        { error: "Cannot delete system rules" },
        { status: 403, headers: corsHeaders }
      );
    await sql`DELETE FROM _supabase_advisors.rules WHERE id = ${id}`;
    return c.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

// ---------------------------------------------------------------------------
// Issues
// ---------------------------------------------------------------------------

api.get("/issues", async (c) => {
  const status = c.req.query("status");
  const category = c.req.query("category");
  const severity = c.req.query("severity");
  try {
    let rows;
    if (status) {
      rows = await sql`
        SELECT * FROM _supabase_advisors.issues
        WHERE status = ${status}
        ORDER BY
          CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
          last_triggered_at DESC`;
    } else {
      rows = await sql`
        SELECT * FROM _supabase_advisors.issues
        ORDER BY
          CASE status WHEN 'open' THEN 0 WHEN 'acknowledged' THEN 1 WHEN 'snoozed' THEN 2 ELSE 3 END,
          CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
          last_triggered_at DESC`;
    }
    if (category) rows = rows.filter((r: any) => r.category === category);
    if (severity) rows = rows.filter((r: any) => r.severity === severity);
    return c.json(rows, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.get("/issues/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const [issue] =
      await sql`SELECT * FROM _supabase_advisors.issues WHERE id = ${id}`;
    if (!issue)
      return c.json({ error: "Not found" }, { status: 404, headers: corsHeaders });

    const alerts = await sql`
      SELECT * FROM _supabase_advisors.alerts
      WHERE issue_id = ${id}
      ORDER BY triggered_at DESC`;

    const conversations = await sql`
      SELECT c.*, json_agg(cm ORDER BY cm.created_at) as messages
      FROM _supabase_advisors.conversations c
      LEFT JOIN _supabase_advisors.conversation_messages cm ON cm.conversation_id = c.id
      WHERE c.issue_id = ${id}
      GROUP BY c.id
      ORDER BY c.created_at DESC`;

    return c.json({ ...issue, alerts, conversations }, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.patch("/issues/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  try {
    const [existing] =
      await sql`SELECT * FROM _supabase_advisors.issues WHERE id = ${id}`;
    if (!existing)
      return c.json({ error: "Not found" }, { status: 404, headers: corsHeaders });

    const newStatus = body.status ?? existing.status;
    const resolvedAt =
      newStatus === "resolved"
        ? body.resolved_at ?? new Date().toISOString()
        : existing.resolved_at;
    const resolvedBy =
      newStatus === "resolved" ? body.resolved_by ?? "user" : existing.resolved_by;
    const snoozedUntil = body.snoozed_until ?? existing.snoozed_until;

    const [row] = await sql`
      UPDATE _supabase_advisors.issues SET
        status = ${newStatus},
        resolved_at = ${resolvedAt},
        resolved_by = ${resolvedBy},
        snoozed_until = ${snoozedUntil},
        assigned_to = ${body.assigned_to ?? existing.assigned_to}
      WHERE id = ${id} RETURNING *`;
    return c.json(row, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

api.get("/alerts", async (c) => {
  const issue_id = c.req.query("issue_id");
  const limit = parseInt(c.req.query("limit") ?? "100", 10);
  try {
    let rows;
    if (issue_id) {
      rows = await sql`
        SELECT * FROM _supabase_advisors.alerts
        WHERE issue_id = ${issue_id}
        ORDER BY triggered_at DESC
        LIMIT ${limit}`;
    } else {
      rows = await sql`
        SELECT * FROM _supabase_advisors.alerts
        ORDER BY triggered_at DESC
        LIMIT ${limit}`;
    }
    return c.json(rows, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

api.get("/agents", async (c) => {
  try {
    const rows =
      await sql`SELECT * FROM _supabase_advisors.agents ORDER BY name`;
    return c.json(rows, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.post("/agents", async (c) => {
  const body = await c.req.json();
  const tools = Array.isArray(body.tools) ? body.tools : [];
  try {
    const [row] = await sql`
      INSERT INTO _supabase_advisors.agents (name, summary, system_prompt, tools)
      VALUES (${body.name}, ${body.summary ?? null}, ${body.system_prompt ?? null}, ${tools})
      RETURNING *`;
    return c.json(row, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.patch("/agents/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const tools = Array.isArray(body.tools) ? body.tools : [];
  try {
    const [row] = await sql`
      UPDATE _supabase_advisors.agents SET
        name = ${body.name}, summary = ${body.summary ?? null},
        system_prompt = ${body.system_prompt ?? null}, tools = ${tools}
      WHERE id = ${id} RETURNING *`;
    if (!row)
      return c.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
    return c.json(row, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.delete("/agents/:id", async (c) => {
  const id = c.req.param("id");
  try {
    await sql`DELETE FROM _supabase_advisors.agents WHERE id = ${id}`;
    return c.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

// ---------------------------------------------------------------------------
// Agent Tasks
// ---------------------------------------------------------------------------

api.get("/agent-tasks", async (c) => {
  const agent_id = c.req.query("agent_id");
  try {
    let rows;
    if (agent_id) {
      rows = await sql`
        SELECT * FROM _supabase_advisors.agent_tasks
        WHERE agent_id = ${agent_id} ORDER BY name`;
    } else {
      rows = await sql`SELECT * FROM _supabase_advisors.agent_tasks ORDER BY name`;
    }
    return c.json(rows, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.post("/agent-tasks", async (c) => {
  const body = await c.req.json();
  try {
    const [row] = await sql`
      INSERT INTO _supabase_advisors.agent_tasks (agent_id, name, description, schedule, is_unique, enabled)
      VALUES (${body.agent_id}, ${body.name}, ${body.description}, ${body.schedule}, ${body.is_unique ?? false}, ${body.enabled ?? true})
      RETURNING *`;
    return c.json(row, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.patch("/agent-tasks/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  try {
    const [row] = await sql`
      UPDATE _supabase_advisors.agent_tasks SET
        agent_id = ${body.agent_id}, name = ${body.name},
        description = ${body.description}, schedule = ${body.schedule},
        is_unique = ${body.is_unique ?? false}, enabled = ${body.enabled ?? true}
      WHERE id = ${id} RETURNING *`;
    if (!row)
      return c.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
    return c.json(row, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.delete("/agent-tasks/:id", async (c) => {
  const id = c.req.param("id");
  try {
    await sql`DELETE FROM _supabase_advisors.agent_tasks WHERE id = ${id}`;
    return c.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

api.get("/conversations", async (c) => {
  const issue_id = c.req.query("issue_id");
  try {
    let rows;
    if (issue_id) {
      rows = await sql`
        SELECT * FROM _supabase_advisors.conversations
        WHERE issue_id = ${issue_id} ORDER BY updated_at DESC`;
    } else {
      rows = await sql`
        SELECT * FROM _supabase_advisors.conversations
        ORDER BY updated_at DESC LIMIT 50`;
    }
    return c.json(rows, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.get("/conversations/:id/messages", async (c) => {
  const id = c.req.param("id");
  try {
    const rows = await sql`
      SELECT * FROM _supabase_advisors.conversation_messages
      WHERE conversation_id = ${id}
      ORDER BY created_at ASC`;
    return c.json(rows, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.post("/conversations/:id/messages", async (c) => {
  const conversationId = c.req.param("id");
  const body = await c.req.json();
  try {
    const [row] = await sql`
      INSERT INTO _supabase_advisors.conversation_messages (id, conversation_id, agent_id, role, parts)
      VALUES (${body.id}, ${conversationId}, ${body.agent_id ?? null}, ${body.role ?? "user"}, ${JSON.stringify(body.parts ?? [])})
      RETURNING *`;
    return c.json(row, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

api.get("/channels", async (c) => {
  try {
    const rows =
      await sql`SELECT * FROM _supabase_advisors.channels ORDER BY name`;
    return c.json(rows, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.post("/channels", async (c) => {
  const body = await c.req.json();
  try {
    const [row] = await sql`
      INSERT INTO _supabase_advisors.channels (type, name, config, severity_filter, category_filter, is_enabled)
      VALUES (${body.type}, ${body.name}, ${JSON.stringify(body.config ?? {})},
        ${body.severity_filter ?? ["critical", "warning"]},
        ${body.category_filter ?? null}, ${body.is_enabled ?? true})
      RETURNING *`;
    return c.json(row, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.patch("/channels/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  try {
    const [existing] =
      await sql`SELECT * FROM _supabase_advisors.channels WHERE id = ${id}`;
    if (!existing)
      return c.json({ error: "Not found" }, { status: 404, headers: corsHeaders });

    const [row] = await sql`
      UPDATE _supabase_advisors.channels SET
        name = ${body.name ?? existing.name},
        config = ${JSON.stringify(body.config ?? existing.config)},
        severity_filter = ${body.severity_filter ?? existing.severity_filter},
        category_filter = ${body.category_filter ?? existing.category_filter},
        is_enabled = ${body.is_enabled ?? existing.is_enabled}
      WHERE id = ${id} RETURNING *`;
    return c.json(row, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

api.delete("/channels/:id", async (c) => {
  const id = c.req.param("id");
  try {
    await sql`DELETE FROM _supabase_advisors.channels WHERE id = ${id}`;
    return c.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

api.get("/notifications", async (c) => {
  const issue_id = c.req.query("issue_id");
  const limit = parseInt(c.req.query("limit") ?? "50", 10);
  try {
    let rows;
    if (issue_id) {
      rows = await sql`
        SELECT * FROM _supabase_advisors.notifications
        WHERE issue_id = ${issue_id}
        ORDER BY created_at DESC LIMIT ${limit}`;
    } else {
      rows = await sql`
        SELECT * FROM _supabase_advisors.notifications
        ORDER BY created_at DESC LIMIT ${limit}`;
    }
    return c.json(rows, { headers: corsHeaders });
  } catch (error: any) {
    return c.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

app.route("/advisors-api", api);

export default app;
