/**
 * Single source of truth for the URL-mode handoff route. The server mints links
 * against this path, so nothing below the page layer should hardcode it.
 */
export const MCP_ELICITATION_ROUTE = '/mcp_callback'

/** ConfigCat kill switch. Exact casing is owned by ConfigCat — do not re-case. */
export const MCP_ELICITATION_FLAG = 'McpElicitURLMode'

/** Shown wherever the request did not identify the calling client. */
export const UNKNOWN_CLIENT_LABEL = 'your AI client'

/**
 * The only tool that mints these links today. v1 is stateless — the URL carries
 * no tool identity — so this is a constant rather than something we read back.
 */
export const ELICITATION_TOOL_NAME = 'create_edge_function_secret'

/**
 * Mirrors the platform's secret-name rule for early feedback only. The server
 * stays authoritative; a name that slips past this still gets rejected there.
 */
export const MAX_SECRET_NAME_LENGTH = 256
export const RESERVED_SECRET_NAME_PREFIX = 'SUPABASE_'

/**
 * Gates the `?state=` screen override. Duplicated literal `process.env` reads so
 * the bundler can tree-shake them out of production.
 */
export const IS_ELICITATION_MOCK_MODE_ENABLED =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
