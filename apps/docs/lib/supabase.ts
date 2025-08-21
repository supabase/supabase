import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { type Database as DatabaseGenerated } from 'common'

export type Database = {
  content: DatabaseGenerated['content']
  graphql_public: DatabaseGenerated['graphql_public']
  public: {
    Tables: Omit<DatabaseGenerated['public']['Tables'], 'page_section'> & {
      page_section: Omit<
        DatabaseGenerated['public']['Tables']['page_section'],
        'Row' | 'Insert' | 'Update'
      > & {
        Row: Omit<DatabaseGenerated['public']['Tables']['page_section']['Row'], 'embedding'> & {
          embedding: Array<number> | null
        }
        Insert: Omit<
          DatabaseGenerated['public']['Tables']['page_section']['Insert'],
          'embedding'
        > & {
          embedding?: Array<number> | null
        }
        Update: Omit<
          DatabaseGenerated['public']['Tables']['page_section']['Update'],
          'embedding'
        > & {
          embedding?: Array<number> | null
        }
      }
    }
    Views: DatabaseGenerated['public']['Views']
    Functions: Omit<
      DatabaseGenerated['public']['Functions'],
      'search_content' | 'search_content_hybrid'
    > & {
      search_content: {
        Args: Omit<
          DatabaseGenerated['public']['Functions']['search_content']['Args'],
          'embedding'
        > & { embedding: Array<number> }
        Returns: Array<
          Omit<
            DatabaseGenerated['public']['Functions']['search_content']['Returns'][number],
            'subsections' | 'metadata'
          > & {
            metadata: {
              subtitle?: string
              language?: string
              methodName?: string
              platform?: string
            }
            subsections: Array<{ title?: string; href?: string; content?: string }>
          }
        >
      }
      search_content_hybrid: {
        Args: Omit<
          DatabaseGenerated['public']['Functions']['search_content_hybrid']['Args'],
          'query_embedding'
        > & { query_embedding: Array<number> }
        Returns: Array<
          Omit<
            DatabaseGenerated['public']['Functions']['search_content_hybrid']['Returns'][number],
            'subsections' | 'metadata'
          > & {
            metadata: {
              subtitle?: string
              language?: string
              methodName?: string
              platform?: string
            }
            subsections: Array<{ title?: string; href?: string; content?: string }>
          }
        >
      }
    }
    Enums: DatabaseGenerated['public']['Enums']
    CompositeTypes: DatabaseGenerated['public']['CompositeTypes']
  }
  storage: DatabaseGenerated['storage']
}

let _supabase: SupabaseClient<Database>

export function supabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return _supabase
}

export type { Database as DatabaseCorrected }
