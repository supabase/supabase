import type { SafeSqlFragment } from '@supabase/pg-meta'
import { IS_PLATFORM } from 'common'
import type { z } from 'zod'

import { getAuthHeaders } from './auth-headers'
import type { ToolContext } from './types'
import { unguarded } from '@/data/fetchers'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { executeQuery } from '@/lib/api/self-hosted/query'

const selfHostedFetcher = async (args: Parameters<typeof executeQuery>[0]) => {
  const result = await executeQuery(args)
  return result.error ? { error: result.error } : { data: result.data }
}

/**
 * Runs a query built by a pg-meta builder against the project's database, for tool factories.
 * Takes the builder's `{ sql, zod }` so only `SafeSqlFragment`s run and rows are validated.
 *
 * Off platform it passes `executeQuery` as the fetcher: without it `executeSql` posts to
 * `API_URL`, which is the relative `/api` unless `NEXT_PUBLIC_SITE_URL` is set, and that can't
 * resolve on the server. It is wrapped because `executeQuery` returns `{ data: undefined, error }`
 * on failure and `executeSql` treats any result with a `data` key as success, which would drop
 * the database error and leave the model with a zod "received undefined" instead.
 */
export async function runPgMetaQuery<TRows>(
  ctx: Pick<ToolContext, 'projectRef' | 'connectionString' | 'authorization'>,
  query: { sql: SafeSqlFragment; zod: z.ZodType<TRows> },
  signal?: AbortSignal
): Promise<TRows> {
  const { result } = await executeSql(
    {
      projectRef: ctx.projectRef,
      connectionString: ctx.connectionString,
      sql: query.sql,
      grant: unguarded.migrating,
    },
    signal,
    getAuthHeaders(ctx.authorization),
    IS_PLATFORM ? undefined : selfHostedFetcher
  )
  return query.zod.parse(result)
}
