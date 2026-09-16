import type { SupabaseContext } from '@supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// Only expose the user-scoped client and verified identity to tools. Keeping
// supabaseAdmin out of this type makes bypassing RLS an explicit design choice.
export type ToolContext = {
  supabase: SupabaseClient
  userClaims: NonNullable<SupabaseContext['userClaims']>
  jwtClaims: NonNullable<SupabaseContext['jwtClaims']>
}
