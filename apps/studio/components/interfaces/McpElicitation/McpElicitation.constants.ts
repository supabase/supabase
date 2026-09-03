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
 * Gates the `?state=` / `?request=` mock overrides. Duplicated literal
 * `process.env` reads so the bundler can tree-shake them out of production.
 */
export const IS_ELICITATION_MOCK_MODE_ENABLED =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
