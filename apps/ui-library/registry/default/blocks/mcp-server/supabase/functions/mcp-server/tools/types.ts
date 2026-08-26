import type { McpServer } from 'npm:@modelcontextprotocol/sdk@1.29.0/server/mcp'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.108.2'

import type { SupabaseFetch } from '../../_shared/supabase.ts'

// The context every toolset receives, built fresh for each request from the
// caller's verified token.
//
// It stays deliberately small and tool-agnostic: a toolset that needs anything
// else (a connection pool, an external client, a cached schema) holds it in its
// own module rather than widening this type. That is what keeps the framework
// free of knowledge about specific tools.
//
export type ToolContext = {
  /** User-scoped Supabase client; the caller's bearer token is attached, so RLS applies. */
  supabase: SupabaseClient
  /** The signed-in user's verified token claims. */
  claims: Record<string, unknown>
  /** The OAuth client that initiated this authorization. */
  clientId: string
  /** Authenticated access to this project's HTTP APIs without exposing the bearer token. */
  fetchSupabase: SupabaseFetch
}

export type Toolset = {
  /** Stable id used for duplicate detection and startup logs. */
  name: string
  /**
   * Add this toolset's tools to a server bound to the current caller. Async
   * registration lets a toolset inspect a project API before deciding which
   * tools to expose.
   */
  register: (server: McpServer, context: ToolContext) => void | Promise<void>
}
