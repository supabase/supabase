import type { SupabaseContext } from 'npm:@supabase/server@1.5.1'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.108.2'

// Only expose the user-scoped client and verified identity to tools. Keeping
// supabaseAdmin out of this type makes bypassing RLS an explicit design choice.
export type ToolContext = {
  supabase: SupabaseClient
  userClaims: NonNullable<SupabaseContext['userClaims']>
  jwtClaims: NonNullable<SupabaseContext['jwtClaims']>
}
