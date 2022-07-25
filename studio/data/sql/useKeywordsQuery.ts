import { UseQueryOptions } from '@tanstack/react-query'
import {
  ExecuteQueryData,
  useExecuteQueryPrefetch,
  useExecuteQueryQuery,
} from './useExecuteQueryQuery'

export const KEYWORDS_QUERY = /* SQL */ `
SELECT * FROM pg_get_keywords();
`

export type KeywordsVariables = {
  projectRef?: string
  connectionString?: string
}

export type KeywordsData = { result: any }
export type KeywordsError = unknown

export const useKeywordsQuery = (
  { projectRef, connectionString }: KeywordsVariables,
  options: UseQueryOptions<KeywordsData, KeywordsError, KeywordsData> = {}
) =>
  useExecuteQueryQuery(
    { projectRef, connectionString, sql: KEYWORDS_QUERY },
    {
      select: (data) => {
        return {
          result: data.result.map((x: any) => x.word.toLocaleLowerCase()),
        }
      },
      ...options,
    }
  )

export const useKeywordsPrefetch = ({ projectRef, connectionString }: KeywordsVariables) => {
  return useExecuteQueryPrefetch({ projectRef, connectionString, sql: KEYWORDS_QUERY })
}
