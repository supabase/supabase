import { getKeywordsSql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'
import { UseCustomQueryOptions } from 'types'

import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { databaseKeys } from './keys'

export type KeywordsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getKeywords(
  { projectRef, connectionString }: KeywordsVariables,
  signal?: AbortSignal
) {
  const sql = getKeywordsSql()

  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['keywords'] },
    signal
  )

  return result.map((x: { word: string }) => x.word.toLocaleLowerCase()) as string[]
}

export type KeywordsData = Awaited<ReturnType<typeof getKeywords>>
export type KeywordsError = ExecuteSqlError

export const useKeywordsQuery = <TData = KeywordsData>(
  { projectRef, connectionString }: KeywordsVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<KeywordsData, KeywordsError, TData> = {}
) =>
  useQuery<KeywordsData, KeywordsError, TData>({
    queryKey: databaseKeys.keywords(projectRef),
    queryFn: ({ signal }) => getKeywords({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
