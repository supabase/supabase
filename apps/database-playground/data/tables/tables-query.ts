import {
  PostgresMetaBase,
  PostgresMetaErr,
  PostgresTable,
  wrapError,
  wrapResult,
} from '@gregnr/postgres-meta/base'
import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { db } from '~/lib/db'

export type TablesVariables = {
  schemas?: string[]
  includeColumns?: boolean
}
export type TablesData = PostgresTable[]
export type TablesError = PostgresMetaErr['error']

const pgMeta = new PostgresMetaBase({
  query: async (sql) => {
    try {
      const res = await db.query(sql)
      return wrapResult<any[]>(res.rows)
    } catch (error) {
      return wrapError(error, sql)
    }
  },
  end: async () => {},
})

export async function getTablesForQuery({ schemas, includeColumns = false }: TablesVariables) {
  const { data, error } = await pgMeta.tables.list({ includedSchemas: schemas, includeColumns })

  if (error) {
    throw error
  }

  return data
}

export const useTablesQuery = <TData = TablesData>(
  { schemas, includeColumns }: TablesVariables,
  options: Omit<UseQueryOptions<TablesData, TablesError, TData>, 'queryKey' | 'queryFn'> = {}
) =>
  useQuery<TablesData, TablesError, TData>({
    ...options,
    queryKey: getTablesQueryKey({ schemas, includeColumns }),
    queryFn: () => getTablesForQuery({ schemas, includeColumns }),
    staleTime: Infinity,
  })

export const getTablesQueryKey = ({ schemas, includeColumns }: TablesVariables) => [
  'tables',
  { schemas, includeColumns },
]
