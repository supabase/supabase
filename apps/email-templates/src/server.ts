import {
  EmailTemplateError,
  renderEmailTemplate,
  sendTemplateEmail,
  TEMPLATE_CATALOG,
} from "../mod.ts";
import type { EmailTemplateData, RenderOptions, SendTemplateInput } from "./types.ts";

const SERVICE_NAME = "alazab-email-templates";
const SERVICE_VERSION = "1.0.0";
const DEFAULT_MAX_BODY_BYTES = 256 * 1024;

export interface ServerConfig {
  hostname: string;
  port: number;
  apiToken: string;
  allowedOrigins: Set<string>;
  maxBodyBytes: number;
  enableSend: boolean;
  renderOptions: RenderOptions;
  envReader: (name: string) => string | undefined;
}

function readFileSecret(path: string): string | undefined {
  try {
    const value = Deno.readTextFileSync(path).trim();
    return value || undefined;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    throw error;
  }
}

const runtimeEnvCache = new Map<string, string | undefined>();

export function readRuntimeEnv(name: string): string | undefined {
  if (runtimeEnvCache.has(name)) return runtimeEnvCache.get(name);

  const direct = Deno.env.get(name)?.trim();
  if (direct) {
    runtimeEnvCache.set(name, direct);
    return direct;
  }

  const filePath = Deno.env.get(`${name}_FILE`)?.trim();
  const fromFile = filePath ? readFileSecret(filePath) : undefined;
  runtimeEnvCache.set(name, fromFile);
  return fromFile;
}

function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parseInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return parsed >= min && parsed <= max ? parsed : fallback;
}

function parseOrigins(value: string | undefined): Set<string> {
  const origins = new Set<string>();
  for (const item of (value ?? "").split(",")) {
    const origin = item.trim();
    if (!origin) continue;
    if (origin === "*") throw new Error("ALLOWED_ORIGINS does not accept wildcard '*' values");
    origins.add(new URL(origin).origin);
  }
  return origins;
}

function optionalYear(value: string | undefined): number | undefined {
  if (!value || !/^\d{4}$/.test(value)) return undefined;
  const year = Number(value);
  return year >= 2000 && year <= 9999 ? year : undefined;
}

export function loadServerConfig(): ServerConfig {
  return {
    hostname: readRuntimeEnv("TEMPLATES_BIND") ?? "0.0.0.0",
    port: parseInteger(readRuntimeEnv("TEMPLATES_PORT"), 8080, 1, 65535),
    apiToken: readRuntimeEnv("TEMPLATES_API_TOKEN") ?? "",
    allowedOrigins: parseOrigins(readRuntimeEnv("ALLOWED_ORIGINS")),
    maxBodyBytes: parseInteger(
      readRuntimeEnv("MAX_BODY_BYTES"),
      DEFAULT_MAX_BODY_BYTES,
      1024,
      2 * 1024 * 1024,
    ),
    enableSend: parseBoolean(readRuntimeEnv("ENABLE_SEND"), false),
    renderOptions: {
      brandName: readRuntimeEnv("EMAIL_BRAND_NAME"),
      companyName: readRuntimeEnv("EMAIL_COMPANY_NAME"),
      logoUrl: readRuntimeEnv("EMAIL_LOGO_URL"),
      supportEmail: readRuntimeEnv("EMAIL_SUPPORT_EMAIL"),
      websiteUrl: readRuntimeEnv("EMAIL_WEBSITE_URL"),
      currentYear: optionalYear(readRuntimeEnv("EMAIL_CURRENT_YEAR")),
      allowHttpLocalhost: parseBoolean(readRuntimeEnv("ALLOW_HTTP_LOCALHOST"), false),
    },
    envReader: readRuntimeEnv,
  };
}

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "referrer-policy": "no-referrer",
      ...extraHeaders,
    },
  });
}

function requestId(request: Request): string {
  const incoming = request.headers.get("x-request-id")?.trim();
  return incoming && /^[A-Za-z0-9._:-]{1,100}$/.test(incoming) ? incoming : crypto.randomUUID();
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function constantTimeEqual(left: string, right: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256(left), sha256(right)]);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0 && left.length === right.length;
}

function extractToken(request: Request): string {
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  return bearer || request.headers.get("x-templates-api-token")?.trim() || "";
}

function corsHeaders(request: Request, config: ServerConfig): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin || !config.allowedOrigins.has(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "authorization,content-type,x-request-id,x-templates-api-token",
    "access-control-max-age": "600",
    "vary": "Origin",
  };
}

function originAllowed(request: Request, config: ServerConfig): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return config.allowedOrigins.has(origin);
}

async function authorized(request: Request, config: ServerConfig): Promise<boolean> {
  if (config.apiToken.length < 32) return false;
  const supplied = extractToken(request);
  return supplied.length > 0 && await constantTimeEqual(supplied, config.apiToken);
}

async function readJsonBody(request: Request, maxBytes: number): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new EmailTemplateError("Content-Type must be application/json", "INVALID_CONTENT_TYPE");
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > maxBytes) {
    throw new EmailTemplateError("Request body is too large", "BODY_TOO_LARGE");
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new EmailTemplateError("Request body is too large", "BODY_TOO_LARGE");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new EmailTemplateError("Request body contains invalid JSON", "INVALID_JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new EmailTemplateError("Request body must be a JSON object", "INVALID_JSON_OBJECT");
  }
  return parsed as Record<string, unknown>;
}

function requireString(value: unknown, field: string, max = 250): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new EmailTemplateError(`Field ${field} is invalid`, "INVALID_FIELD", { field });
  }
  return value.trim();
}

function requireObject(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new EmailTemplateError(`Field ${field} must be an object`, "INVALID_FIELD", { field });
  }
  return value as Record<string, unknown>;
}

function validateSendInput(payload: Record<string, unknown>): SendTemplateInput {
  const templateId = requireString(payload.templateId, "templateId");
  const data = requireObject(payload.data, "data") as EmailTemplateData;
  const to = payload.to;
  const validTo = typeof to === "string" ||
    (Array.isArray(to) && to.length > 0 && to.every((entry) => typeof entry === "string"));
  if (!validTo) throw new EmailTemplateError("Field to is invalid", "INVALID_FIELD", { field: "to" });

  const input: SendTemplateInput = { templateId, data, to: to as string | string[] };
  if (payload.from !== undefined) input.from = requireString(payload.from, "from", 500);
  if (payload.replyTo !== undefined) input.replyTo = requireString(payload.replyTo, "replyTo", 320);
  if (payload.idempotencyKey !== undefined) {
    input.idempotencyKey = requireString(payload.idempotencyKey, "idempotencyKey", 200);
  }
  if (payload.tags !== undefined) {
    const tags = requireObject(payload.tags, "tags");
    const entries = Object.entries(tags);
    if (entries.length > 20 || entries.some(([key, value]) => key.length > 100 || typeof value !== "string" || value.length > 200)) {
      throw new EmailTemplateError("Field tags is invalid", "INVALID_FIELD", { field: "tags" });
    }
    input.tags = Object.fromEntries(entries) as Record<string, string>;
  }
  return input;
}

function publicMetadata() {
  return TEMPLATE_CATALOG.map(({ html: _html, text: _text, ...metadata }) => metadata);
}

function readiness(config: ServerConfig) {
  const tokenConfigured = config.apiToken.length >= 32;
  let providerReady = true;
  let provider = "disabled";

  if (config.enableSend) {
    provider = (config.envReader("EMAIL_PROVIDER") ?? "resend").toLowerCase();
    providerReady = provider === "resend"
      ? Boolean(config.envReader("RESEND_API_KEY"))
      : provider === "webhook"
      ? Boolean(config.envReader("EMAIL_WEBHOOK_URL") && config.envReader("EMAIL_WEBHOOK_SECRET"))
      : false;
  }

  return {
    ready: tokenConfigured && providerReady && TEMPLATE_CATALOG.length === 144,
    tokenConfigured,
    sendEnabled: config.enableSend,
    provider,
    providerReady,
    templates: TEMPLATE_CATALOG.length,
  };
}

function errorStatus(error: EmailTemplateError): number {
  if (error.code === "BODY_TOO_LARGE") return 413;
  if (error.code === "MISSING_ENV") return 503;
  if (error.code === "EMAIL_PROVIDER_ERROR") return 502;
  return 400;
}

export function createHandler(config: ServerConfig): (request: Request) => Promise<Response> {
  const metadata = publicMetadata();

  return async (request: Request): Promise<Response> => {
    const id = requestId(request);
    const url = new URL(request.url);
    const commonHeaders = { "x-request-id": id, ...corsHeaders(request, config) };

    if (request.method === "OPTIONS") {
      if (!originAllowed(request, config)) return jsonResponse({ error: "origin_not_allowed", requestId: id }, 403);
      return new Response(null, { status: 204, headers: commonHeaders });
    }

    if (request.method === "GET" && url.pathname === "/healthz") {
      return jsonResponse({ status: "ok", service: SERVICE_NAME, version: SERVICE_VERSION }, 200, commonHeaders);
    }

    if (request.method === "GET" && url.pathname === "/readyz") {
      const state = readiness(config);
      return jsonResponse(state, state.ready ? 200 : 503, commonHeaders);
    }

    if (request.method === "GET" && url.pathname === "/") {
      return jsonResponse({
        service: SERVICE_NAME,
        version: SERVICE_VERSION,
        templates: TEMPLATE_CATALOG.length,
        endpoints: ["/healthz", "/readyz", "/v1/templates", "/v1/render", "/v1/send"],
      }, 200, commonHeaders);
    }

    if (!originAllowed(request, config)) {
      return jsonResponse({ error: "origin_not_allowed", requestId: id }, 403, commonHeaders);
    }

    if (!await authorized(request, config)) {
      return jsonResponse({ error: "unauthorized", requestId: id }, 401, {
        ...commonHeaders,
        "www-authenticate": 'Bearer realm="alazab-email-templates"',
      });
    }

    try {
      if (request.method === "GET" && url.pathname === "/v1/templates") {
        return jsonResponse({ count: metadata.length, templates: metadata }, 200, commonHeaders);
      }

      if (request.method === "GET" && url.pathname.startsWith("/v1/templates/")) {
        const templateId = decodeURIComponent(url.pathname.slice("/v1/templates/".length));
        const template = metadata.find((entry) => entry.id === templateId);
        return template
          ? jsonResponse(template, 200, commonHeaders)
          : jsonResponse({ error: "template_not_found", requestId: id }, 404, commonHeaders);
      }

      if (request.method === "POST" && url.pathname === "/v1/render") {
        const payload = await readJsonBody(request, config.maxBodyBytes);
        const templateId = requireString(payload.templateId, "templateId");
        const data = requireObject(payload.data, "data") as EmailTemplateData;
        const rendered = renderEmailTemplate(templateId, data, config.renderOptions);
        return jsonResponse(rendered, 200, commonHeaders);
      }

      if (request.method === "POST" && url.pathname === "/v1/send") {
        if (!config.enableSend) {
          return jsonResponse({ error: "send_disabled", requestId: id }, 403, commonHeaders);
        }
        const payload = await readJsonBody(request, config.maxBodyBytes);
        const input = validateSendInput(payload);
        const result = await sendTemplateEmail(input, config.envReader, config.renderOptions);
        console.log(JSON.stringify({ event: "email_sent", requestId: id, templateId: input.templateId, provider: result.provider }));
        return jsonResponse({ success: true, provider: result.provider, id: result.id }, 202, commonHeaders);
      }

      return jsonResponse({ error: "not_found", requestId: id }, 404, commonHeaders);
    } catch (error) {
      if (error instanceof EmailTemplateError) {
        console.warn(JSON.stringify({ event: "request_rejected", requestId: id, code: error.code }));
        return jsonResponse({ error: error.code, message: error.message, requestId: id }, errorStatus(error), commonHeaders);
      }
      console.error(JSON.stringify({ event: "request_failed", requestId: id }));
      return jsonResponse({ error: "internal_error", requestId: id }, 500, commonHeaders);
    }
  };
}

if (import.meta.main) {
  const config = loadServerConfig();
  const handler = createHandler(config);
  const state = readiness(config);
  console.log(JSON.stringify({
    event: "service_start",
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    hostname: config.hostname,
    port: config.port,
    templates: TEMPLATE_CATALOG.length,
    ready: state.ready,
    sendEnabled: config.enableSend,
  }));
  Deno.serve({ hostname: config.hostname, port: config.port }, handler);
}
