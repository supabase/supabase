import { PostgresTable } from '@supabase/postgres-meta'
import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { db } from '~/app/page'
import { PostgresMetaErr, getTables } from '~/lib/pg-meta'

export type TablesVariables = {
  schemas?: string[]
  includeColumns?: boolean
}
export type TablesData = PostgresTable[]
export type TablesError = PostgresMetaErr['error']

export async function getTablesForQuery({ schemas, includeColumns = false }: TablesVariables) {
  const { data, error } = await getTables(db, { includedSchemas: schemas, includeColumns })

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
