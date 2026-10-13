import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Search V2 lives in its own Supabase project (see ./sql/setup.sql), separate from the main
// docs content DB `lib/supabase.ts` connects to — so it needs its own client and its own
// hand-written Database type (there's no generated schema for this project).
export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: {
      search_docs: {
        Args: { query_text: string; match_limit?: number }
        Returns: Array<{
          slug: string
          page_title: string
          heading: string
          heading_level: number
          heading_path: string[]
          excerpt: string
          score: number
        }>
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

let _supabaseSearchV2: SupabaseClient<Database>

export function supabaseSearchV2() {
  if (!_supabaseSearchV2) {
    _supabaseSearchV2 = createClient<Database>(
      `https://${process.env.SEARCH_V2_SUPABASE_PROJECT_ID}.supabase.co`,
      process.env.SEARCH_V2_SUPABASE_SECRET_KEY!
    )
  }

  return _supabaseSearchV2
}
