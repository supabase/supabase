import { promises as fs, createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { homedir, platform as osPlatform } from "node:os";
import { dirname, join, resolve, relative, sep } from "node:path";
import { statfs } from "node:fs/promises";

const VERSION = "0.1.0";
const MAX_INLINE = 8 * 1024 * 1024;
const DEFAULT_INTERVAL_MS = 5000;

function args() {
  const out = { _: [] };
  for (let i = 2; i < process.argv.length; i++) {
    const value = process.argv[i];
    if (!value.startsWith("--")) { out._.push(value); continue; }
    const [key, inline] = value.slice(2).split("=", 2);
    if (inline !== undefined) out[key] = inline;
    else out[key] = process.argv[++i];
  }
  return out;
}

function platformName() {
  const p = osPlatform();
  return p === "win32" ? "windows" : p === "darwin" ? "macos" : p === "linux" ? "linux" : "other";
}

function configPath(explicit) {
  return explicit ? resolve(explicit) : join(homedir(), ".testagram", "storage-node.json");
}

async function saveConfig(file, config) {
  await fs.mkdir(dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
}

async function loadConfig(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

function apiUrl(base, path) {
  return new URL(path, base.endsWith("/") ? base : base + "/").toString();
}

async function request(config, path, options = {}) {
  const headers = { "content-type": "application/json", ...(options.headers ?? {}) };
  if (config.session_token) headers["x-testagram-node-session"] = config.session_token;
  const response = await fetch(apiUrl(config.url, path), { ...options, headers });
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!response.ok) {
    const error = new Error(body.error ?? body.raw ?? `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

async function sha256File(file) {
  const hash = createHash("sha256");
  const stream = createReadStream(file);
  for await (const chunk of stream) hash.update(chunk);
  return hash.digest("hex");
}

async function realRoot(rootPath) {
  const stat = await fs.lstat(rootPath);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("Configured root must be a real directory");
  return fs.realpath(rootPath);
}

async function safePath(rootPath, relativePath) {
  if (typeof relativePath !== "string" || !relativePath || relativePath.length > 2048) throw new Error("Invalid relative path");
  if (relativePath.startsWith("/") || relativePath.includes("\\") || /(^|[\\/])\.\.([\\/]|$)/.test(relativePath)) {
    throw new Error("Path traversal rejected");
  }

  const root = await realRoot(rootPath);
  const candidate = resolve(root, ...relativePath.split("/"));
  const rel = relative(root, candidate);
  if (!rel || rel.startsWith(".."+sep) || rel === ".." || rel.includes(sep+".."+sep)) throw new Error("Path escaped root");

  const parts = rel.split(sep);
  let current = root;
  for (let i = 0; i < parts.length; i++) {
    current = join(current, parts[i]);
    try {
      const stat = await fs.lstat(current);
      if (stat.isSymbolicLink()) throw new Error("Symlink path component rejected");
    } catch (error) {
      if (error?.code === "ENOENT" && i === parts.length - 1) break;
      throw error;
    }
  }
  return { root, candidate };
}

async function filesystemCapacity(rootPath) {
  try {
    const fsInfo = await statfs(rootPath);
    return {
      capacity: Number(fsInfo.blocks) * Number(fsInfo.bsize),
      free: Number(fsInfo.bavail) * Number(fsInfo.bsize),
    };
  } catch {
    return { capacity: 0, free: 0 };
  }
}

function rootsPayload(config) {
  return Object.entries(config.roots).map(([root_identifier]) => ({
    root_identifier,
    display_name: root_identifier,
    read_allowed: true,
    write_allowed: false,
    delete_allowed: false,
  }));
}

async function enroll(a) {
  if (!a.url || !a["pairing-token"]) throw new Error("--url and --pairing-token are required");
  const roots = {};
  for (const item of a.root ?? []) {
    const [alias, ...pathParts] = String(item).split("=");
    const path = pathParts.join("=");
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(alias) || !path) throw new Error("Root must be alias=path");
    roots[alias] = resolve(path);
  }
  const response = await fetch(apiUrl(a.url, "/enroll"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      pairing_token: a["pairing-token"],
      device_name: a["device-name"] ?? "Testagram Storage Node",
      platform: a.platform ?? platformName(),
      agent_version: VERSION,
      roots: Object.keys(roots).map((root_identifier) => ({ root_identifier, display_name: root_identifier })),
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);

  const file = configPath(a.config);
  const rootIds = {};
  for (const serverRoot of body.node.roots ?? []) {
    if (roots[serverRoot.root_identifier]) {
      rootIds[serverRoot.id] = {
        path: roots[serverRoot.root_identifier],
        root_identifier: serverRoot.root_identifier,
      };
    }
  }
  const config = {
    url: a.url,
    node_id: body.node.id,
    node_secret: body.node_secret,
    session_token: body.session_token,
    roots,
    root_ids: rootIds,
    version: VERSION,
  };
  await saveConfig(file, config);
  console.log(JSON.stringify({
    node_id: config.node_id,
    config: file,
    roots: Object.keys(roots),
    warning: "The node secret was returned once and is stored in the local credential file.",
  }, null, 2));
}

async function execute(config, command) {
  const rootId = command.root_id;
  const root = config.root_ids?.[rootId];
  if (!root) throw new Error("Unknown root id; restart the agent to refresh root mappings");
  const { candidate } = await safePath(root.path, command.relative_path);
  const payload = command.payload ?? {};

  if (command.operation === "stat") {
    const s = await fs.stat(candidate);
    return { path: command.relative_path, size_bytes: s.size, modified_at: s.mtime?.toISOString() ?? null, is_file: s.isFile(), is_directory: s.isDirectory() };
  }
  if (command.operation === "hash") {
    const s = await fs.stat(candidate);
    if (!s.isFile()) throw new Error("hash requires a file");
    return { path: command.relative_path, size_bytes: s.size, sha256: await sha256File(candidate) };
  }
  if (command.operation === "mkdir") {
    await fs.mkdir(candidate, { recursive: true });
    return { path: command.relative_path, created: true };
  }
  if (command.operation === "delete") {
    const s = await fs.lstat(candidate);
    if (s.isDirectory()) throw new Error("Directory deletion is disabled in the node protocol");
    await fs.unlink(candidate);
    return { path: command.relative_path, deleted: true };
  }
  if (command.operation === "write_base64") {
    const data = Buffer.from(String(payload.base64 ?? ""), "base64");
    if (data.byteLength > MAX_INLINE) throw new Error("Inline write exceeds 8 MiB limit");
    const expected = payload.sha256;
    const actual = createHash("sha256").update(data).digest("hex");
    if (expected && expected !== actual) throw new Error("Payload SHA-256 mismatch");
    await fs.mkdir(dirname(candidate), { recursive: true });
    await fs.writeFile(candidate, data);
    return { path: command.relative_path, size_bytes: data.byteLength, sha256: actual };
  }
  if (command.operation === "read_base64") {
    const s = await fs.stat(candidate);
    if (!s.isFile() || s.size > MAX_INLINE) throw new Error("Inline read is limited to 8 MiB files");
    const data = await fs.readFile(candidate);
    return { path: command.relative_path, size_bytes: data.byteLength, sha256: createHash("sha256").update(data).digest("hex"), base64: data.toString("base64") };
  }
  throw new Error("Unsupported operation");
}

async function refreshSession(config) {
  const response = await fetch(apiUrl(config.url, "/session"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-testagram-node-id": config.node_id,
      "x-testagram-node-secret": config.node_secret,
    },
    body: "{}",
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
  config.session_token = body.token;
  await saveConfig(config.file, config);
}

async function heartbeat(config) {
  let capacity = 0;
  let used = 0;
  for (const root of Object.values(config.root_ids ?? {})) {
    const info = await filesystemCapacity(root.path);
    capacity = Math.max(capacity, info.capacity);
    used = Math.max(used, info.capacity - info.free);
  }
  await request(config, "/heartbeat", {
    method: "POST",
    body: JSON.stringify({ storage_capacity_bytes: capacity, storage_used_bytes: used, agent_version: VERSION }),
  });
}

async function poll(config) {
  try {
    await heartbeat(config);
    const body = await request(config, "/commands/next");
    if (!body.command) return;
    let result;
    try {
      result = await execute(config, body.command);
      await request(config, `/commands/${body.command.id}/result`, {
        method: "POST",
        body: JSON.stringify({ ok: true, result }),
      });
    } catch (error) {
      await request(config, `/commands/${body.command.id}/result`, {
        method: "POST",
        body: JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
      });
    }
  } catch (error) {
    if (error?.status === 401) {
      await refreshSession(config);
      return;
    }
    console.error("[storage-node]", error instanceof Error ? error.message : String(error));
  }
}

async function run(a) {
  const file = configPath(a.config);
  const config = await loadConfig(file);
  config.file = file;
  if (!config.root_ids || Object.keys(config.root_ids).length === 0) {
    console.warn("[storage-node] No server-approved roots are configured yet. Approve a root before issuing commands.");
  }
  await heartbeat(config);
  console.log(`Testagram Storage Node ${VERSION} connected: ${config.node_id}`);
  while (true) {
    await poll(config);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, DEFAULT_INTERVAL_MS));
  }
}

const a = args();
const command = a._[0];
if (command === "enroll") {
  await enroll(a);
} else if (command === "run") {
  await run(a);
} else {
  console.error("Usage: node src/index.mjs enroll|run [options]");
  process.exit(2);
}
