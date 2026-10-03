// css/app.css is compiled by the tailwind watcher straight to priv/static/assets/app.css. Importing
// it here made esbuild emit an unprocessed file to that same path, so whichever finished last won
// and the page sometimes loaded with raw @tailwind directives.
import "phoenix_html";
import { Socket } from "phoenix";
import { LiveSocket } from "phoenix_live_view";
import topbar from "../vendor/topbar";
import { RealtimeClient } from "@supabase/realtime-js";
import { matches, segments } from "./fuzzy.mjs";

const Hooks = {};

const MAX_STRING = 512;
const MAX_DEPTH = 6;

// realtime-js logs the socket URL verbatim, apikey query param and all, and that string ends up in
// the log row, its title attribute and the exported file. Strip credentials before anything else
// sees them.
const CREDENTIAL_PARAM = /([?&](?:apikey|token|access_token)=)[^&\s]+/gi;
const JWT = /\beyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\b/g;

function redact(text) {
  return text.replace(CREDENTIAL_PARAM, "$1[redacted]").replace(JWT, "[redacted]");
}

function fromDomEvent(value) {
  if (typeof Event === "undefined" || !(value instanceof Event)) return null;

  const out = { type: value.type };
  if (typeof value.code === "number") out.code = value.code;
  if (value.reason) out.reason = value.reason;
  if (value.message) out.message = value.message;
  if (value.wasClean !== undefined) out.was_clean = value.wasClean;
  return out;
}

function cleanPayload(value, depth = 0) {
  if (value === null || value === undefined) return undefined;
  if (depth > MAX_DEPTH) return "[nested]";

  if (typeof value === "string") {
    const trimmed = redact(value.trim());
    if (trimmed === "") return undefined;
    return trimmed.length > MAX_STRING ? `${trimmed.slice(0, MAX_STRING)}… (${trimmed.length} chars)` : trimmed;
  }

  if (typeof value !== "object") return value;

  if (value instanceof Error) return { name: value.name, message: value.message };

  const domEvent = fromDomEvent(value);
  if (domEvent) return domEvent;

  if (Array.isArray(value)) {
    const items = value.map((item) => cleanPayload(item, depth + 1)).filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }

  const out = {};
  for (const [key, item] of Object.entries(value)) {
    const cleaned = cleanPayload(item, depth + 1);
    if (cleaned !== undefined) out[key] = cleaned;
  }
  return Object.keys(out).length ? out : undefined;
}

function unwrap(payload) {
  const cleaned = cleanPayload(payload);
  if (cleaned && typeof cleaned === "object" && !Array.isArray(cleaned)) {
    const keys = Object.keys(cleaned);
    if (keys.length === 1 && keys[0] === "data") return cleaned.data;
  }
  return cleaned;
}

// Heartbeats and their replies both ride the reserved "phoenix" topic. Matching only "heartbeat"
// let the reply frame ("ok phoenix phx_reply (7)") through.
function isHeartbeat(message) {
  if (typeof message !== "string") return false;
  return message.includes("heartbeat") || /(^|\s)phoenix\s/.test(message);
}

function claimsOf(jwt) {
  try {
    const payload = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=")));
  } catch {
    return {};
  }
}

function reasonText(error, fallback) {
  if (!error) return fallback;
  const text = error instanceof Error ? error.message : String(error);
  return text.replace(/^Error:\s*/i, "").trim() || fallback;
}

// The browser hides the failed handshake's status code, so "transport failure" is all realtime-js
// can report. Re-request the same URL over HTTP to work out what actually broke. A CORS-blocked
// response still tells us the host answered, so fall back to a no-cors reachability probe rather
// than blaming the network for what is really a wrong path or a rejected token.
async function diagnose(host) {
  let url;
  try {
    url = new URL(`${socketPath(host)}/websocket`, host);
  } catch {
    return "That host is not a valid URL.";
  }

  try {
    const res = await fetch(url, { method: "GET", mode: "cors" });

    if (res.status === 404) return `No Realtime server at ${url.host}. Check the project ref or host.`;
    if (res.status === 401 || res.status === 403) return `${url.host} rejected the token.`;
    if (res.status >= 500) return `${url.host} returned ${res.status}.`;
    return null;
  } catch {
    try {
      await fetch(url, { method: "GET", mode: "no-cors" });
      return `${url.host} answered but refused the websocket. Check the project ref, host and token.`;
    } catch {
      return `Could not reach ${url.host}. Check the URL, your network, or whether the server is running.`;
    }
  }
}

// A bare local `mix phx.server` instance only speaks the internal `/socket` path. Every hosted
// project (and anything else pointed at through a gateway) rewrites the public `/realtime/v1`
// path down to that same internal socket, so that's the path to use for everything else.
function socketPath(host) {
  const hostname = new URL(host).hostname;
  const isLocal = hostname === "localhost" || hostname.endsWith(".localhost");
  return isLocal ? "/socket" : "/realtime/v1";
}

function logEvent(hook, category, event, payload, latencyMs = null) {
  hook.pushEventTo("#event_log", "log_event", {
    category,
    event: typeof event === "string" ? redact(event) : event,
    payload: unwrap(payload) ?? {},
    received_at: new Date().toISOString(),
    latency_ms: latencyMs,
  });
}

Hooks.payload = {
  initRealtime(connection) {
    const {
      channel: channelName,
      host,
      log_level,
      token,
      schema,
      table,
      event,
      filter,
      select,
      bearer,
      enable_presence,
      enable_db_changes,
      private_channel,
    } = connection;

    if (this.channel) this.channel.unsubscribe();
    if (this.realtimeSocket) this.realtimeSocket.disconnect();

    const endpoint = new URL(socketPath(host), host);
    endpoint.protocol = endpoint.protocol.replace("http", "ws");

    this.realtimeSocket = new RealtimeClient(endpoint.toString(), {
      params: { apikey: token, log_level },
      heartbeatCallback: (status, latency) =>
        this.pushEvent("transport_status", { status, latency_ms: latency ?? null }),
      logger: (kind, msg, data) => {
        if (isHeartbeat(msg)) return;
        logEvent(this, kind, msg, { data });
      },
    });

    if (bearer) this.realtimeSocket.setAuth(bearer);

    this.channel = this.realtimeSocket.channel(channelName, {
      config: { broadcast: { self: true }, private: !!private_channel },
    });

    this.channel.on("system", {}, (payload) => {
      if (payload.extension === "postgres_changes") {
        if (payload.status === "ok") this.pushEvent("postgres_subscribed", { schema, table, filter });
        else if (payload.status === "error")
          this.pushEvent("postgres_error", { reason: payload.message ?? "unknown error" });
      }
      logEvent(this, "system", payload.extension ?? "system", payload);
    });

    this.channel.on("broadcast", { event: "*" }, (payload) => {
      logEvent(this, "broadcast", payload.event ?? "broadcast", payload);
    });

    if (enable_presence) {
      this.channel.on("presence", { event: "sync" }, () => {
        this.pushEvent("presence_synced", { count: Object.keys(this.channel.presenceState()).length });
      });

      this.channel.on("presence", { event: "*" }, (payload) => {
        logEvent(this, "presence", payload.event ?? "presence", payload);
      });
    }

    if (enable_db_changes) {
      // The server rejects a string, so an empty list is omitted rather than sent.
      const columns = Array.isArray(select) ? select : [];
      const opts = {
        event: event || "*",
        schema,
        table,
        ...(filter ? { filter } : {}),
        ...(columns.length ? { select: columns } : {}),
      };

      this.channel.on("postgres_changes", opts, (payload) => {
        const latency = performance.now() + performance.timeOrigin - Date.parse(payload.commit_timestamp);
        logEvent(this, "postgres", payload.eventType ?? "postgres_changes", payload, latency);
      });
    }

    this.everJoined = false;
    this.pushEvent("channel_status", { status: "joining", reason: null });

    this.channel.subscribe(async (status, error) => {
      if (status !== "SUBSCRIBED") {
        if (status === "CLOSED" && !this.everJoined) {
          this.pushEvent("channel_status", { status: "closed", reason: null });
          return;
        }

        const reason = reasonText(error, status === "TIMED_OUT" ? "join timed out" : "connection lost");
        this.pushEvent("channel_status", {
          status: status === "TIMED_OUT" ? "timed_out" : "retrying",
          reason,
        });

        if (!this.everJoined && !this.diagnosing) {
          this.diagnosing = true;
          diagnose(host)
            .then((detail) => detail && this.pushEvent("channel_status", { status: "retrying", reason: detail }))
            .finally(() => (this.diagnosing = false));
        }
        return;
      }

      this.everJoined = true;
      this.pushEvent("channel_status", { status: "joined", host, reason: null });
      localStorage.setItem("token", token);
      localStorage.setItem("bearer", bearer ?? "");

      if (enable_presence) {
        await this.channel.track({ name: "user_" + Math.floor(Math.random() * 100), t: performance.now() });
      }
    });
  },

  sendRealtime(event, payload) {
    this.channel.send({ type: "broadcast", event, payload });
  },

  disconnectRealtime() {
    this.channel.unsubscribe();
    this.pushEvent("channel_status", { status: "closed", reason: null });
    this.pushEvent("transport_status", { status: "disconnected", latency_ms: null });
  },

  clearLocalStorage() {
    localStorage.clear();
  },

  mounted() {
    this.pushEventTo("#conn_form", "local_storage", {
      token: localStorage.getItem("token"),
      bearer: localStorage.getItem("bearer"),
    });

    this.handleEvent("connect", ({ connection }) => this.initRealtime(connection));
    this.handleEvent("send_message", ({ message }) => this.sendRealtime(message.event, message.payload));
    this.handleEvent("disconnect", () => this.disconnectRealtime());
    this.handleEvent("clear_local_storage", () => this.clearLocalStorage());
  },
};

Hooks.copyToClipboard = {
  mounted() {
    this.label = this.el.querySelector("#share-button-label");
    this.originalLabel = this.label.textContent;

    this.el.addEventListener("click", () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        clearTimeout(this.resetTimer);
        this.label.textContent = "Copied";
        this.resetTimer = setTimeout(() => (this.label.textContent = this.originalLabel), 1500);
      });
    });
  },
};

Hooks.themeToggle = {
  mounted() {
    this.el.addEventListener("click", () => {
      const isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  },
};

// Keeps a <details> panel's open/closed state across LiveView DOM patches (which otherwise reset
// native `open` every time the event log streams a new row).
Hooks.detailsKeepState = {
  mounted() {
    this.open = this.el.open;
    this.el.addEventListener("toggle", () => (this.open = this.el.open));
  },
  updated() {
    this.el.open = this.open;
  },
};

// Newest rows are prepended at the top, so keep the view pinned to the top — releasing the pin
// once the user scrolls down to read older entries.
Hooks.autoscroll = {
  mounted() {
    this.pinned = true;
    this.el.addEventListener("scroll", () => {
      this.pinned = this.el.scrollTop < 40;
    });
  },

  updated() {
    if (this.pinned) this.el.scrollTop = 0;
  },
};

// Owns filtering for the event log.
//
// Rows arrive through a LiveView stream, which renders each row once and never revisits it. A
// server-side filter therefore only ever reaches rows that have not arrived yet, leaving everything
// already on screen stale. Filtering here keeps every row honest and makes search instant.
Hooks.logFilter = {
  mounted() {
    this.rows = this.el.querySelector("#event_log_rows");
    this.input = this.el.querySelector("[data-role=search]");
    this.counter = this.el.querySelector("[data-role=match-count]");

    this.input.addEventListener("input", () => this.apply());
    this.apply();
  },

  updated() {
    this.apply();
  },

  apply() {
    const query = this.input.value || "";
    const active = new Set((this.el.dataset.categories || "").split(",").filter(Boolean));

    let shown = 0;
    let total = 0;

    for (const row of this.rows.children) {
      total += 1;

      const label = row.dataset.label || "";
      const haystack = `${label} ${row.dataset.event || ""} ${row.dataset.payload || ""}`;
      const visible = active.has(row.dataset.category) && matches(haystack, query);

      row.classList.toggle("hidden", !visible);

      if (visible) {
        shown += 1;
        this.mark(row, label, query);
      }
    }

    this.counter.textContent = total === 0 ? "" : shown === total ? `${total}` : `${shown} of ${total}`;
  },

  // Rebuilds the event cell as text nodes plus <mark>, never innerHTML, so a payload can never
  // inject markup into the page.
  mark(row, label, query) {
    const cell = row.querySelector("[data-role=event-label]");
    if (!cell) return;

    const parts = segments(label, query);
    const signature = parts.map((p) => `${p.matched ? 1 : 0}:${p.text}`).join("|");
    if (cell.dataset.signature === signature) return;

    cell.replaceChildren(
      ...parts.map((part) => {
        if (!part.matched) return document.createTextNode(part.text);
        const hit = document.createElement("mark");
        hit.className = "search-hit";
        hit.textContent = part.text;
        return hit;
      }),
    );
    cell.dataset.signature = signature;
  },
};

// Exchanges an email and password for a user JWT via GoTrue on the same host, then drops it into
// the bearer field. Testing RLS as a real signed-in user otherwise means leaving the tool to run
// curl and pasting the result back.
Hooks.signIn = {
  mounted() {
    this.email = this.el.querySelector("[data-role=email]");
    this.password = this.el.querySelector("[data-role=password]");
    this.button = this.el.querySelector("[data-role=sign-in]");
    this.status = this.el.querySelector("[data-role=sign-in-status]");

    this.button.addEventListener("click", () => this.signIn());
    for (const field of [this.email, this.password]) {
      field.addEventListener("keydown", (event) => event.key === "Enter" && this.signIn());
    }
  },

  say(message, tone = "neutral") {
    this.status.textContent = message;
    this.status.className = {
      neutral: "text-xs text-gray-500 dark:text-neutral-400",
      ok: "text-xs text-brand-700 dark:text-brand-300",
      error: "text-xs text-red-600 dark:text-red-400",
    }[tone];
  },

  async signIn() {
    const host = document.getElementById("conn_form_host")?.value?.trim();
    const apikey = document.getElementById("conn_form_token")?.value?.trim();

    if (!host) return this.say("Set a host first.", "error");
    if (!apikey) return this.say("Set the anon key first.", "error");

    let url;
    try {
      url = new URL("/auth/v1/token?grant_type=password", host);
    } catch {
      return this.say("That host is not a valid URL.", "error");
    }

    this.button.disabled = true;
    this.say("Signing in...");

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { apikey, "Content-Type": "application/json" },
        body: JSON.stringify({ email: this.email.value.trim(), password: this.password.value }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        return this.say(body.error_description || body.msg || `Sign in failed (${res.status}).`, "error");
      }

      const bearer = document.getElementById("conn_form_bearer");
      bearer.value = body.access_token;
      bearer.dispatchEvent(new Event("input", { bubbles: true }));

      const role = claimsOf(body.access_token).role;
      this.say(`Signed in as ${body.user?.email ?? "user"}${role ? ` (${role})` : ""}. Reconnect to apply.`, "ok");
      this.password.value = "";
    } catch {
      this.say("Could not reach the auth server on that host.", "error");
    } finally {
      this.button.disabled = false;
    }
  },
};

Hooks.exportLog = {
  mounted() {
    this.el.addEventListener("click", () => {
      const rows = document.querySelectorAll("#event_log_rows > tr:not(.hidden)");
      const lines = Array.from(rows).map((row) =>
        JSON.stringify({
          category: row.dataset.category,
          event: row.dataset.event,
          received_at: row.dataset.receivedAt,
          latency_ms: row.dataset.latencyMs ? Number(row.dataset.latencyMs) : null,
          payload: JSON.parse(row.dataset.payload),
        }),
      );

      const blob = new Blob([lines.join("\n")], { type: "application/x-ndjson" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `realtime-event-log-${new Date().toISOString()}.ndjson`;
      a.click();
      URL.revokeObjectURL(url);
    });
  },
};

const csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content");

const liveSocket = new LiveSocket("/live", Socket, {
  hooks: Hooks,
  params: { _csrf_token: csrfToken },
});

topbar.config({ barColors: { 0: "#29d" }, shadowColor: "rgba(0, 0, 0, .3)" });
window.addEventListener("phx:page-loading-start", () => topbar.show());
window.addEventListener("phx:page-loading-stop", () => topbar.hide());

liveSocket.connect();

window.liveSocket = liveSocket;
