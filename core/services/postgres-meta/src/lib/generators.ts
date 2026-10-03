import {
  introspect,
  sortGeneratorMetadata,
  type GeneratorMetadata,
  type Queryable,
} from '@supabase/postgrest-typegen'
import PostgresMeta from './PostgresMeta.js'
import { PostgresMetaResult } from './types.js'

// Re-export so existing consumers can keep importing the type from here.
export type { GeneratorMetadata }

/**
 * Adapter over `@supabase/postgrest-typegen`'s `introspect()`, preserving the
 * historical `getGeneratorMetadata` signature and `{ data, error }` contract.
 *
 * The package is driver-agnostic: it takes a structural `Queryable` whose
 * `query()` resolves to `{ rows }` and throws on failure. We wrap `pgMeta.query`
 * (which returns `{ data, error }`) into that shape and surface the first query
 * error as the result error. Unlike the previous implementation, the pool is
 * ended on error paths too, not just on success.
 */
export async function getGeneratorMetadata(
  pgMeta: PostgresMeta,
  filters: { includedSchemas?: string[]; excludedSchemas?: string[] } = {
    includedSchemas: [],
    excludedSchemas: [],
  }
): Promise<PostgresMetaResult<GeneratorMetadata>> {
  const queryable: Queryable = {
    query: async (sql: string) => {
      const { data, error } = await pgMeta.query(sql)
      if (error) {
        throw error
      }
      return { rows: data ?? [] }
    },
  }

  try {
    // The generators emit objects in metadata order, so apply the package's
    // canonical sort pass before returning (and before any generator runs).
    const data = sortGeneratorMetadata(
      await introspect(queryable, {
        includedSchemas: filters.includedSchemas,
        excludedSchemas: filters.excludedSchemas,
      })
    )
    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error as PostgresMetaResult<GeneratorMetadata>['error'] & { message: string },
    }
  } finally {
    await pgMeta.end()
  }
}
