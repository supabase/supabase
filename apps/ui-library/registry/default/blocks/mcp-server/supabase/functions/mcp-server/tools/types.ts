import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.108.2'

// The context every toolset receives, built fresh for each request from the
// caller's verified token.
//
// It stays deliberately small and tool-agnostic: a toolset that needs anything
// else (a connection pool, an external client, a cached schema) holds it in its
// own module rather than widening this type. That is what keeps the framework
// free of knowledge about specific tools.
//
// Framework-owned. Toolset blocks replace ./index.ts, never this file.

export type ToolPrincipal = {
  /** Verified JWT claims for the signed-in user (sub, role, email, …). */
  claims: Record<string, unknown>
}

export type ToolContext = {
  /** User-scoped Supabase client; the caller's bearer token is attached, so RLS applies. */
  supabase: SupabaseClient
  /** The signed-in user's verified token claims. */
  principal: ToolPrincipal
  /** Verified bearer token for toolsets that need another Supabase project API. */
  accessToken: string
}
