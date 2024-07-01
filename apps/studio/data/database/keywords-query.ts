import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from '../sql/execute-sql-query'

export type DatabaseKeyword = { word: string }

export const getKeywordsQuery = () => {
  const sql = /* SQL */ `
SELECT word FROM pg_get_keywords();
`.trim()

  return sql
}

export type KeywordsVariables = {
  projectRef?: string
  connectionString?: string
}

export type KeywordsData = { result: string[] }
export type KeywordsError = ExecuteSqlError

export const useKeywordsQuery = <TData extends KeywordsData = KeywordsData>(
  { projectRef, connectionString }: KeywordsVariables,
  options: UseQueryOptions<ExecuteSqlData, KeywordsError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getKeywordsQuery(),
      queryKey: ['keywords'],
    },
    {
      select: (data) => {
        return {
          result: data.result.map((x: DatabaseKeyword) => x.word.toLocaleLowerCase()),
        } as any
      },
      ...options,
    }
  )
}
