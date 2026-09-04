/**
 * The wrapper document and wire protocol for an assistant-generated page.
 *
 * SECURITY MODEL
 *
 * The generated markup is model output. It is rendered in an iframe with
 * `sandbox="allow-scripts"` and no `allow-same-origin`, so the frame gets an opaque
 * origin: it cannot read the parent DOM, cookies, localStorage, or any Studio credential,
 * and it cannot navigate the top window. Everything it is allowed to do is enumerated
 * here.
 *
 * The frame never sends SQL. It sends a query *id* from the set the user approved, and the
 * parent looks that id up in a map of already-promoted fragments. An id that is not in the
 * map cannot execute, so the frame has no way to widen its own access — the worst it can
 * do is re-run a query the user already read and approved.
 *
 * Two things are baked into the document rather than passed over the channel: the project
 * URL and the publishable key. Both are public values, and having them present before the
 * generated script runs is what lets `window.supabase` exist synchronously. Nothing else
 * about the user's session — no connection string, no Studio authorization header, no
 * service-role or secret key — is ever placed in this document.
 *
 * The CSP is deny-by-default. Network egress is limited to the project's own HTTPS and
 * WebSocket origins, and scripts to one pinned CDN build of supabase-js, and only when the
 * page actually asked for the client.
 */
import { z } from 'zod'

/**
 * Pinned to the workspace catalog version of `@supabase/supabase-js` so the client running
 * inside the frame matches the one Studio itself builds against. Bump both together.
 */
export const SUPABASE_JS_VERSION = '2.112.4'
export const SUPABASE_JS_CDN_URL = `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@${SUPABASE_JS_VERSION}/dist/umd/supabase.js`
const SUPABASE_JS_CDN_ORIGIN = 'https://cdn.jsdelivr.net'

export const GENERATED_PAGE_MIN_HEIGHT = 160
export const GENERATED_PAGE_MAX_HEIGHT = 2400
export const GENERATED_PAGE_INITIAL_HEIGHT = 420

/** Handshake the parent posts into the frame, carrying the `MessageChannel` port. */
export const GENERATED_PAGE_INIT_MESSAGE = 'studio:generated-page:init'

export function clampGeneratedPageHeight(height: number): number {
  if (!Number.isFinite(height)) return GENERATED_PAGE_INITIAL_HEIGHT
  return Math.min(
    GENERATED_PAGE_MAX_HEIGHT,
    Math.max(GENERATED_PAGE_MIN_HEIGHT, Math.round(height))
  )
}

/**
 * Messages the frame may send to the parent. Anything that does not parse is dropped
 * without a reply — a frame that can talk at all is already running untrusted code, so the
 * parent treats every field as hostile until zod says otherwise.
 */
export const generatedPageFrameMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('query'),
    requestId: z.string().min(1).max(64),
    kind: z.enum(['database', 'logs']),
    queryId: z.string().min(1).max(64),
  }),
  z.object({
    type: z.literal('resize'),
    height: z.number().finite(),
  }),
])

export type GeneratedPageFrameMessage = z.infer<typeof generatedPageFrameMessageSchema>

/** The parent's reply to a `query` message. Rows only ever travel in this direction. */
export type GeneratedPageQueryResponse = {
  type: 'query-result'
  requestId: string
} & ({ ok: true; rows: unknown[] } | { ok: false; error: { message: string } })

export type GeneratedPageSupabaseConfig = {
  projectUrl: string
  publishableKey: string
}

export type BuildGeneratedPageDocumentOptions = {
  html: string
  databaseQueryIds: readonly string[]
  logQueryIds: readonly string[]
  /** Omitted when the page did not ask for a client, or when the parent could not build one. */
  supabase?: GeneratedPageSupabaseConfig
}

/**
 * Derives the `connect-src` entries for a project URL: its own HTTPS origin plus the
 * matching WebSocket origin for Realtime. Returns an empty list for anything that is not a
 * well-formed HTTPS URL, which collapses `connect-src` to `'none'`.
 */
export function getProjectConnectOrigins(projectUrl: string): string[] {
  let parsed: URL
  try {
    parsed = new URL(projectUrl)
  } catch {
    return []
  }
  if (parsed.protocol !== 'https:') return []
  return [parsed.origin, `wss://${parsed.host}`]
}

/**
 * Serializes a value for embedding in an inline `<script>`. `</script>` inside a JSON
 * string would otherwise close the tag early, so `<` is escaped; the result is still valid
 * JSON and still valid JavaScript.
 */
function toInlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function buildContentSecurityPolicy(supabase: GeneratedPageSupabaseConfig | undefined): string {
  const connectOrigins = supabase ? getProjectConnectOrigins(supabase.projectUrl) : []
  const scriptSources = ["'unsafe-inline'", ...(supabase ? [SUPABASE_JS_CDN_ORIGIN] : [])]

  return [
    "default-src 'none'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'unsafe-inline'",
    'img-src data:',
    'font-src data:',
    `connect-src ${connectOrigins.length > 0 ? connectOrigins.join(' ') : "'none'"}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ')
}

/**
 * The bootstrap script, injected into `<head>` so it finishes before any generated markup
 * or script is parsed. It installs `window.studio`, waits for the parent's port, and
 * mirrors uncaught errors into a banner so a broken page explains itself in place.
 *
 * Written as a plain string rather than a real module: it executes in the frame, not in
 * Studio's bundle, and must stay readable in view-source when debugging a generated page.
 */
function buildBootstrapScript(options: BuildGeneratedPageDocumentOptions): string {
  const config = {
    initMessage: GENERATED_PAGE_INIT_MESSAGE,
    databaseQueryIds: [...options.databaseQueryIds],
    logQueryIds: [...options.logQueryIds],
    minHeight: GENERATED_PAGE_MIN_HEIGHT,
    maxHeight: GENERATED_PAGE_MAX_HEIGHT,
    supabase: options.supabase ?? null,
  }

  return `
(function () {
  var config = ${toInlineJson(config)};
  var port = null;
  var pending = new Map();
  var readyResolvers = [];
  var isReady = false;

  function showError(message) {
    var banner = document.getElementById('studio-error-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'studio-error-banner';
      banner.setAttribute('role', 'alert');
      document.body.insertBefore(banner, document.body.firstChild);
    }
    banner.textContent = message;
    banner.hidden = false;
  }

  window.addEventListener('error', function (event) {
    showError('This page hit an error: ' + (event.message || 'unknown error'));
  });
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    showError(
      'This page hit an error: ' +
        ((reason && reason.message) || String(reason) || 'unknown error')
    );
  });

  function send(message) {
    if (port) port.postMessage(message);
  }

  function reportHeight() {
    var height = Math.max(
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 0
    );
    send({
      type: 'resize',
      height: Math.min(config.maxHeight, Math.max(config.minHeight, height)),
    });
  }

  function query(kind, ids, id) {
    if (ids.indexOf(id) === -1) {
      return Promise.reject(
        new Error('Query "' + id + '" was not declared for this page.')
      );
    }
    return whenReady().then(function () {
      return new Promise(function (resolve, reject) {
        var requestId =
          Math.random().toString(36).slice(2) + '-' + Math.random().toString(36).slice(2);
        pending.set(requestId, { resolve: resolve, reject: reject });
        send({ type: 'query', requestId: requestId, kind: kind, queryId: id });
      });
    });
  }

  function whenReady() {
    if (isReady) return Promise.resolve();
    return new Promise(function (resolve) {
      readyResolvers.push(resolve);
    });
  }

  window.studio = {
    queries: { database: config.databaseQueryIds.slice(), logs: config.logQueryIds.slice() },
    database: {
      query: function (id) {
        return query('database', config.databaseQueryIds, id);
      },
    },
    logs: {
      query: function (id) {
        return query('logs', config.logQueryIds, id);
      },
    },
    ready: whenReady(),
    onReady: function (callback) {
      whenReady().then(function () {
        try {
          var result = callback();
          if (result && typeof result.catch === 'function') {
            result.catch(function (error) {
              showError('This page hit an error: ' + ((error && error.message) || 'unknown error'));
            });
          }
        } catch (error) {
          showError('This page hit an error: ' + ((error && error.message) || 'unknown error'));
        }
      });
    },
  };

  function handlePortMessage(event) {
    var data = event.data;
    if (!data || data.type !== 'query-result') return;
    var entry = pending.get(data.requestId);
    if (!entry) return;
    pending.delete(data.requestId);
    if (data.ok) entry.resolve(data.rows);
    else entry.reject(new Error((data.error && data.error.message) || 'Query failed'));
  }

  window.addEventListener('message', function onInit(event) {
    if (!event.data || event.data.type !== config.initMessage) return;
    if (!event.ports || event.ports.length === 0) return;
    window.removeEventListener('message', onInit);

    port = event.ports[0];
    port.onmessage = handlePortMessage;
    port.start();

    isReady = true;
    var resolvers = readyResolvers.slice();
    readyResolvers.length = 0;
    resolvers.forEach(function (resolve) {
      resolve();
    });

    reportHeight();
  });

  function startObservingHeight() {
    reportHeight();
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(reportHeight).observe(document.documentElement);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObservingHeight);
  } else {
    startObservingHeight();
  }

  if (config.supabase) {
    var factory = window.supabase && window.supabase.createClient;
    if (typeof factory === 'function') {
      window.supabase = factory(config.supabase.projectUrl, config.supabase.publishableKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
    } else {
      window.supabase = undefined;
    }
  }
})();
`
}

const BASE_STYLES = `
  :root { color-scheme: light; }
  html, body { margin: 0; padding: 0; }
  body {
    background: #ffffff;
    color: #171717;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    padding: 16px;
  }
  #studio-error-banner[hidden] { display: none; }
  #studio-error-banner {
    margin: 0 0 12px;
    padding: 8px 12px;
    border: 1px solid #f0b4b4;
    border-radius: 6px;
    background: #fdf2f2;
    color: #8c1c1c;
    font-size: 13px;
  }
`

/**
 * Builds the complete `srcdoc` for a generated page.
 *
 * The generated `html` is inserted verbatim into `<body>`. That is intentional: it is
 * arbitrary markup that the sandbox — not sanitization — is responsible for containing.
 */
export function buildGeneratedPageDocument(options: BuildGeneratedPageDocumentOptions): string {
  const csp = buildContentSecurityPolicy(options.supabase)
  const supabaseScript = options.supabase ? `<script src="${SUPABASE_JS_CDN_URL}"></script>` : ''

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <style>${BASE_STYLES}</style>
    ${supabaseScript}
    <script>${buildBootstrapScript(options)}</script>
  </head>
  <body>
    <div id="studio-error-banner" role="alert" hidden></div>
${options.html}
  </body>
</html>`
}
