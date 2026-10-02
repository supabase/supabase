import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SECRET_KEYS = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
const SERVICE_KEY = SECRET_KEYS.default ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase server credentials are not configured");

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SESSION_TTL_SECONDS = 15 * 60;
const PAIRING_TTL_SECONDS = 10 * 60;
const MAX_BASE64_BYTES = 8 * 1024 * 1024;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-testagram-node-session, x-testagram-node-secret",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });

const fail = (message: string, status = 400) => json({ error: message }, status);

function randomToken(prefix: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const value = btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  return prefix + value;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function bearer(req: Request) {
  const value = req.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7) : null;
}

async function requireUser(req: Request) {
  const token = bearer(req);
  if (!token) throw new Response("Unauthorized", { status: 401 });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Response("Unauthorized", { status: 401 });
  return data.user;
}

async function issueSession(nodeId: string) {
  const raw = randomToken("tg_node_session_");
  const tokenHash = await sha256(raw);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await admin.from("storage_node_sessions").delete().eq("node_id", nodeId);
  const { error } = await admin.from("storage_node_sessions").insert({
    node_id: nodeId, token_hash: tokenHash, expires_at: expiresAt,
  });
  if (error) throw error;
  return { token: raw, expires_at: expiresAt };
}

async function requireNodeSession(req: Request) {
  const raw = req.headers.get("x-testagram-node-session");
  if (!raw) throw new Response("Missing node session", { status: 401 });
  const tokenHash = await sha256(raw);
  const { data: session } = await admin.from("storage_node_sessions")
    .select("id,node_id,expires_at").eq("token_hash", tokenHash).maybeSingle();
  if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
    throw new Response("Invalid or expired node session", { status: 401 });
  }
  const { data: node } = await admin.from("storage_nodes")
    .select("id,user_id,status").eq("id", session.node_id).maybeSingle();
  if (!node || node.status === "revoked") throw new Response("Node revoked", { status: 403 });
  await admin.from("storage_node_sessions").update({ last_used_at: new Date().toISOString() }).eq("id", session.id);
  return { node, session };
}

async function requireNodeSecret(req: Request) {
  const raw = req.headers.get("x-testagram-node-secret");
  const nodeId = req.headers.get("x-testagram-node-id");
  if (!raw || !nodeId) throw new Response("Missing node credentials", { status: 401 });
  const hash = await sha256(raw);
  const { data: node } = await admin.from("storage_nodes")
    .select("id,user_id,status,node_secret_hash").eq("id", nodeId).maybeSingle();
  if (!node || node.status === "revoked" || !node.node_secret_hash || node.node_secret_hash !== hash) {
    throw new Response("Invalid node credential", { status: 401 });
  }
  return node;
}

async function requireOwner(req: Request, nodeId: string) {
  const user = await requireUser(req);
  const { data: node } = await admin.from("storage_nodes")
    .select("id,user_id,status").eq("id", nodeId).eq("user_id", user.id).maybeSingle();
  if (!node) throw new Response("Node not found", { status: 404 });
  return { user, node };
}

async function parseBody(req: Request) {
  try { return await req.json(); } catch { throw new Response("Invalid JSON", { status: 400 }); }
}

function safeRelativePath(value: unknown) {
  if (typeof value !== "string" || value.length < 1 || value.length > 2048) return false;
  return !/(^|[\\/])\.\.([\\/]|$)/.test(value) && !value.startsWith("/") && !value.includes("\\");
}

async function route(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/storage-node-gateway/, "") || "/";

  if (req.method === "POST" && path === "/pairings") {
    const user = await requireUser(req);
    const raw = randomToken("tg_pair_");
    const expiresAt = new Date(Date.now() + PAIRING_TTL_SECONDS * 1000).toISOString();
    const { error } = await admin.from("storage_node_pairings").insert({
      user_id: user.id, token_hash: await sha256(raw), expires_at: expiresAt,
    });
    if (error) throw error;
    return json({ pairing_token: raw, expires_at: expiresAt });
  }

  if (req.method === "POST" && path === "/enroll") {
    const body = await parseBody(req);
    if (typeof body.pairing_token !== "string") return fail("pairing_token is required");
    const { data: pairing } = await admin.from("storage_node_pairings")
      .select("id,user_id,expires_at,used_at").eq("token_hash", await sha256(body.pairing_token)).maybeSingle();
    if (!pairing || pairing.used_at || new Date(pairing.expires_at).getTime() <= Date.now()) {
      return fail("Pairing token is invalid or expired", 401);
    }

    const platform = String(body.platform ?? "other");
    if (!["windows", "linux", "macos", "android", "ios", "other"].includes(platform)) return fail("Unsupported platform");
    const deviceName = String(body.device_name ?? "Testagram Storage Node").trim();
    const agentVersion = String(body.agent_version ?? "unknown").trim();
    if (!deviceName || deviceName.length > 120 || !agentVersion || agentVersion.length > 64) return fail("Invalid device metadata");

    const { data: node, error: nodeError } = await admin.from("storage_nodes").insert({
      user_id: pairing.user_id, device_name: deviceName, platform, agent_version: agentVersion,
      status: "pending",
    }).select("id,device_name,platform,agent_version,status").single();
    if (nodeError || !node) throw nodeError ?? new Error("Node creation failed");

    const roots = Array.isArray(body.roots) ? body.roots.slice(0, 32) : [];
    if (roots.length) {
      const rows = roots.map((root: any) => ({
        node_id: node.id,
        display_name: String(root.display_name ?? root.root_identifier ?? "Storage"),
        root_identifier: String(root.root_identifier ?? ""),
        enabled: false,
        read_allowed: root.read_allowed !== false,
        write_allowed: root.write_allowed === true,
        delete_allowed: root.delete_allowed === true,
      }));
      const { error } = await admin.from("storage_node_roots").insert(rows);
      if (error) {
        await admin.from("storage_nodes").delete().eq("id", node.id);
        throw error;
      }
    }

    const nodeSecret = randomToken("tg_node_");
    const { error: secretError } = await admin.from("storage_nodes").update({
      node_secret_hash: await sha256(nodeSecret),
      node_secret_rotated_at: new Date().toISOString(),
      status: "online",
      last_seen_at: new Date().toISOString(),
    }).eq("id", node.id);
    if (secretError) throw secretError;

    await admin.from("storage_node_pairings").update({ used_at: new Date().toISOString() }).eq("id", pairing.id);
    const session = await issueSession(node.id);
    const { data: nodeRoots } = await admin.from("storage_node_roots")
      .select("id,display_name,root_identifier,enabled,read_allowed,write_allowed,delete_allowed")
      .eq("node_id", node.id);

    return json({
      node: { ...node, status: "online", roots: nodeRoots ?? [] },
      node_secret: nodeSecret,
      session_token: session.token,
      session_expires_at: session.expires_at,
      warning: "Store node_secret in the agent's secure local credential store. It is shown once.",
    }, 201);
  }

  if (req.method === "POST" && path === "/session") {
    const node = await requireNodeSecret(req);
    const session = await issueSession(node.id);
    await admin.from("storage_nodes").update({
      status: "online", last_seen_at: new Date().toISOString(),
    }).eq("id", node.id);
    return json({ node_id: node.id, ...session });
  }

  if (req.method === "POST" && path === "/heartbeat") {
    const current = await requireNodeSession(req);
    const body = await parseBody(req);
    const capacity = Number(body.storage_capacity_bytes ?? 0);
    const used = Number(body.storage_used_bytes ?? 0);
    if (!Number.isSafeInteger(capacity) || capacity < 0 || !Number.isSafeInteger(used) || used < 0) return fail("Invalid storage counters");
    const { error } = await admin.from("storage_nodes").update({
      status: "online", last_seen_at: new Date().toISOString(),
      storage_capacity_bytes: capacity, storage_used_bytes: used,
      agent_version: String(body.agent_version ?? "unknown"),
    }).eq("id", current.node.id);
    if (error) throw error;
    return json({ ok: true, node_id: current.node.id, server_time: new Date().toISOString() });
  }

  if (req.method === "GET" && path === "/commands/next") {
    const current = await requireNodeSession(req);
    const { data: command } = await admin.from("storage_node_commands")
      .select("id,operation,root_id,relative_path,payload,created_at")
      .eq("node_id", current.node.id).eq("status", "queued")
      .order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (!command) return json({ command: null });

    const { data: root } = await admin.from("storage_node_roots")
      .select("id,enabled,read_allowed,write_allowed,delete_allowed")
      .eq("id", command.root_id).eq("node_id", current.node.id).maybeSingle();

    const isRead = ["stat", "hash", "read_base64"].includes(command.operation);
    const allowed = root?.enabled && (isRead ? root.read_allowed : command.operation === "delete" ? root.delete_allowed : root.write_allowed);
    if (!allowed) {
      await admin.from("storage_node_commands").update({
        status: "failed", error_message: "Storage root or operation permission denied",
        completed_at: new Date().toISOString(),
      }).eq("id", command.id);
      return json({ command: null });
    }

    await admin.from("storage_node_commands").update({
      status: "claimed", claimed_at: new Date().toISOString(),
    }).eq("id", command.id).eq("status", "queued");
    return json({ command });
  }

  if (req.method === "POST" && path.startsWith("/commands/") && path.endsWith("/result")) {
    const current = await requireNodeSession(req);
    const id = path.split("/")[2];
    const body = await parseBody(req);
    const { data: command } = await admin.from("storage_node_commands")
      .select("id,status").eq("id", id).eq("node_id", current.node.id).maybeSingle();
    if (!command) return fail("Command not found", 404);
    if (command.status !== "claimed") return fail("Command is not claimed", 409);

    const resultText = JSON.stringify(body.result ?? {});
    if (new TextEncoder().encode(resultText).byteLength > 10 * 1024 * 1024) return fail("Command result too large");
    const ok = body.ok === true;
    await admin.from("storage_node_commands").update({
      status: ok ? "completed" : "failed",
      result: ok ? (body.result ?? {}) : null,
      error_message: ok ? null : String(body.error ?? "Command failed"),
      completed_at: new Date().toISOString(),
    }).eq("id", id);
    return json({ ok: true });
  }

  if (req.method === "GET" && path === "/nodes") {
    const user = await requireUser(req);
    const { data, error } = await admin.from("storage_nodes")
      .select("id,device_name,platform,agent_version,status,last_seen_at,storage_capacity_bytes,storage_used_bytes,created_at,revoked_at")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) throw error;
    return json({ nodes: data ?? [] });
  }

  if (req.method === "POST" && path.startsWith("/roots/") && path.endsWith("/approve")) {
    const rootId = path.split("/")[2];
    const user = await requireUser(req);
    const body = await parseBody(req);
    const { data: root } = await admin.from("storage_node_roots").select("id,node_id").eq("id", rootId).maybeSingle();
    if (!root) return fail("Root not found", 404);
    const { data: node } = await admin.from("storage_nodes").select("id").eq("id", root.node_id).eq("user_id", user.id).maybeSingle();
    if (!node) return fail("Root not found", 404);

    const { data, error } = await admin.from("storage_node_roots").update({
      enabled: body.enabled !== false,
      read_allowed: body.read_allowed !== false,
      write_allowed: body.write_allowed === true,
      delete_allowed: body.delete_allowed === true,
    }).eq("id", rootId).select("id,display_name,root_identifier,enabled,read_allowed,write_allowed,delete_allowed").single();
    if (error) throw error;
    return json({ root: data });
  }

  if (req.method === "POST" && path === "/commands") {
    const user = await requireUser(req);
    const body = await parseBody(req);
    if (!["stat", "hash", "mkdir", "delete", "write_base64", "read_base64"].includes(body.operation)) return fail("Unsupported operation");
    if (typeof body.node_id !== "string" || typeof body.root_id !== "string" || !safeRelativePath(body.relative_path)) return fail("Invalid command target");

    if (body.operation === "write_base64") {
      if (typeof body.payload?.base64 !== "string") return fail("write_base64 requires payload.base64");
      const bytes = Math.floor(body.payload.base64.length * 0.75);
      if (bytes > MAX_BASE64_BYTES) return fail("write_base64 is limited to 8 MiB");
    }

    const { data: node } = await admin.from("storage_nodes").select("id").eq("id", body.node_id).eq("user_id", user.id).eq("status", "online").maybeSingle();
    if (!node) return fail("Node not found or offline", 404);
    const { data: root } = await admin.from("storage_node_roots").select("id,enabled").eq("id", body.root_id).eq("node_id", body.node_id).maybeSingle();
    if (!root || !root.enabled) return fail("Root is not approved", 403);

    const { data: command, error } = await admin.from("storage_node_commands").insert({
      node_id: body.node_id, owner_id: user.id, operation: body.operation,
      root_id: body.root_id, relative_path: body.relative_path, payload: body.payload ?? {},
    }).select("id,status,operation,root_id,relative_path,created_at").single();
    if (error) throw error;
    return json({ command }, 201);
  }

  if (req.method === "DELETE" && path.startsWith("/nodes/")) {
    const nodeId = path.split("/")[2];
    const { node } = await requireOwner(req, nodeId);
    await admin.from("storage_nodes").update({
      status: "revoked", revoked_at: new Date().toISOString(),
    }).eq("id", node.id);
    await admin.from("storage_node_sessions").delete().eq("node_id", node.id);
    return json({ ok: true, node_id: node.id, status: "revoked" });
  }

  return fail("Not found", 404);
}

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    try { return await route(req); }
    catch (error) {
      if (error instanceof Response) return error;
      console.error("storage-node-gateway error", error);
      return fail("Internal storage-node gateway error", 500);
    }
  },
};
