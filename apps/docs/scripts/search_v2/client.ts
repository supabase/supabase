import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Search V2 lives in the same Supabase project as the docs content DB (schema in
// supabase/migrations/*_create_docs_search_v2.sql), but it's not part of the generated `Database`
// type `lib/supabase.ts` uses — so it needs its own client (secret key, not anon) and its own
// hand-written Database type.
export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: {
      docs_search_v2: {
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
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )
  }

  return _supabaseSearchV2
}
