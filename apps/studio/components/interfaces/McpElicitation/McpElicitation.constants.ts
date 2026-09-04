export const MCP_ELICITATION_ROUTE = '/mcp_callback'

export const MCP_ELICITATION_FLAG = 'McpElicitURLMode'

export const UNKNOWN_CLIENT_LABEL = 'your AI client'

export const ELICITATION_TOOL_NAME = 'create_edge_function_secret'

export const MAX_SECRET_NAME_LENGTH = 256
export const RESERVED_SECRET_NAME_PREFIX = 'SUPABASE_'

export const IS_ELICITATION_MOCK_MODE_ENABLED =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
