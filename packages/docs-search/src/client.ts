import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const TABLE_NAME = 'docs_sections'
export const SEARCH_FUNCTION = 'search_docs'

// Search lives in its own Supabase project (see ../sql/setup.sql), separate from the main
// docs content DB — so it needs its own client and its own hand-written Database type
// (there's no generated schema for this project).
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

export function createSearchClient(url: string, secretKey: string): SupabaseClient<Database> {
  return createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
}
