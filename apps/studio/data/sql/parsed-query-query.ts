import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { sqlKeys } from './keys'
import { constructHeaders, fetchHandler } from '@/data/fetchers'
import { BASE_PATH } from '@/lib/constants'
import { queryRelationReferenceSchema } from '@/lib/query-relations'
import { editableQuerySchema } from '@/lib/query-result-editing'

export type ParsedQueryVariables = { sql?: string }

const parsedQuerySchema = z.object({
  editableQuery: editableQuerySchema.nullable(),
  relations: z.array(queryRelationReferenceSchema),
  /** The first statement's parse node name, such as `SelectStmt` or `CreateStmt`. */
  statementType: z.string().nullable(),
  statementCount: z.number(),
})

export type ParsedQueryData = z.infer<typeof parsedQuerySchema> | null

/** Resolves to null when the SQL can't be parsed — unsupported syntax must not block results. */
async function getParsedQuery({ sql }: ParsedQueryVariables, signal?: AbortSignal) {
  if (!sql) throw new Error('sql is required')
  const response = await fetchHandler(`${BASE_PATH}/api/parse-query`, {
    method: 'POST',
    headers: await constructHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ sql }),
    signal,
  })
  if (!response.ok) return null
  return parsedQuerySchema.parse(await response.json())
}

export const parsedQueryQueryOptions = ({ sql }: ParsedQueryVariables) =>
  queryOptions({
    queryKey: sqlKeys.parsedQuery(sql),
    queryFn: ({ signal }) => getParsedQuery({ sql }, signal),
    enabled: !!sql,
    retry: false,
    staleTime: Infinity,
  })
