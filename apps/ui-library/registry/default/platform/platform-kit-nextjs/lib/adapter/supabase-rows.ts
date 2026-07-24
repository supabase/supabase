import type { SupabaseClient } from '@supabase/supabase-js'

import type { SelectRowsResult } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/types'

/**
 * Table-row CRUD backed by supabase-js `.from()` (PostgREST). Shared by every
 * adapter — the data plane is identical for classic Supabase and supalite.
 *
 * `.schema()` is only invoked for non-default schemas since supalite (SQLite)
 * is single-schema and rejects `.schema()`.
 */
export function createRowOps(supabase: SupabaseClient) {
  const table = (schema: string | undefined, name: string) =>
    schema && schema !== 'public' ? supabase.schema(schema).from(name) : supabase.from(name)

  return {
    async selectRows(opts: {
      schema?: string
      table: string
      limit?: number
      offset?: number
    }): Promise<SelectRowsResult> {
      const limit = opts.limit ?? 100
      const offset = opts.offset ?? 0
      const { data, count, error } = await table(opts.schema, opts.table)
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
      if (error) throw error
      return { rows: data ?? [], count: count ?? null }
    },

    async updateRow(opts: {
      schema?: string
      table: string
      values: Record<string, any>
      match: Record<string, any>
    }): Promise<void> {
      const { error } = await table(opts.schema, opts.table).update(opts.values).match(opts.match)
      if (error) throw error
    },

    async insertRow(opts: {
      schema?: string
      table: string
      values: Record<string, any>
    }): Promise<void> {
      const { error } = await table(opts.schema, opts.table).insert(opts.values)
      if (error) throw error
    },

    async deleteRow(opts: {
      schema?: string
      table: string
      match: Record<string, any>
    }): Promise<void> {
      const { error } = await table(opts.schema, opts.table).delete().match(opts.match)
      if (error) throw error
    },
  }
}
