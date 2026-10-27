import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// TEMPORARY: this client and its `search_docs` RPC read from the previous, separate Search V2 project
// (SEARCH_V2_SUPABASE_PROJECT_ID + SEARCH_V2_SUPABASE_SECRET_KEY, see ./sql/setup.sql). The ingest
// (./supabase.ts) now writes to `docs_search_v2` in the main project, so remove this file and the
// SEARCH_V2_* env vars once the search_v2 API route is moved there.
//
// It needs its own hand-written Database type: there's no generated schema for this project.
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
