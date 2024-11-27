import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { databaseKeys } from './keys'

export const getKeywordsSql = () => {
  const sql = /* SQL */ `
SELECT word FROM pg_get_keywords();
`.trim()

  return sql
}

export type KeywordsVariables = {
  projectRef?: string
  connectionString?: string
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
  { enabled = true, ...options }: UseQueryOptions<KeywordsData, KeywordsError, TData> = {}
) =>
  useQuery<KeywordsData, KeywordsError, TData>(
    databaseKeys.keywords(projectRef),
    ({ signal }) => getKeywords({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
