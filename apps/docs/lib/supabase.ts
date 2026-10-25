import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { type Database as DatabaseGenerated } from 'common'

type GeneratedFunctions = DatabaseGenerated['public']['Functions']

/**
 * The generated types describe `vector` arguments as `string` and the `metadata` and `subsections`
 * json columns as `Json`. The docs app passes embeddings as number arrays and reads the shapes
 * below, so override just those fields on the search functions.
 */
type SearchFunction<
  Name extends
    | 'search_content'
    | 'search_content_nimbus'
    | 'search_content_hybrid'
    | 'search_content_hybrid_nimbus',
  EmbeddingArg extends 'embedding' | 'query_embedding',
> = {
  Args: Omit<GeneratedFunctions[Name]['Args'], EmbeddingArg> & {
    [Key in EmbeddingArg]: Array<number>
  }
  Returns: Array<
    Omit<GeneratedFunctions[Name]['Returns'][number], 'subsections' | 'metadata'> & {
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

export type DatabaseCorrected = Omit<DatabaseGenerated, 'public'> & {
  public: Omit<DatabaseGenerated['public'], 'Functions'> & {
    Functions: Omit<
      GeneratedFunctions,
      | 'search_content'
      | 'search_content_nimbus'
      | 'search_content_hybrid'
      | 'search_content_hybrid_nimbus'
    > & {
      search_content: SearchFunction<'search_content', 'embedding'>
      search_content_nimbus: SearchFunction<'search_content_nimbus', 'embedding'>
      search_content_hybrid: SearchFunction<'search_content_hybrid', 'query_embedding'>
      search_content_hybrid_nimbus: SearchFunction<
        'search_content_hybrid_nimbus',
        'query_embedding'
      >
    }
  }
}

let _supabase: SupabaseClient<DatabaseCorrected>

export function supabase() {
  if (!_supabase) {
    _supabase = createClient<DatabaseCorrected>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return _supabase
}
