import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { Query } from 'components/grid/query/Query'
import { sortBy } from 'lodash'
import { executeSql } from '../sql/execute-sql-query'
import { pgSodiumKeys } from './keys'

export interface EncryptionKey {
  id: string
  key_id: number
  name: string
  comment: string
  created: string
  status: string
}

export const getPgSodiumKeysQuery = () => {
  const sql = new Query()
    .from('key', 'pgsodium')
    .select('id,key_id,name,comment,created,status')
    .toSql()

  return sql
}

export type PgSodiumKeysVariables = {
  projectRef?: string
  connectionString?: string
}

const getPgSodiumKeys = async (
  { projectRef, connectionString }: PgSodiumKeysVariables,
  signal?: AbortSignal
) => {
  const sql = getPgSodiumKeysQuery()
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: pgSodiumKeys.list(projectRef),
    },
    signal
  )
  return result
}

export type PgSodiumKeysData = EncryptionKey[]
export type PgSodiumKeysError = unknown

export const usePgSodiumKeysQuery = <TData = PgSodiumKeysData>(
  { projectRef, connectionString }: PgSodiumKeysVariables,
  { enabled, ...options }: UseQueryOptions<PgSodiumKeysData, PgSodiumKeysError, TData> = {}
) =>
  useQuery<PgSodiumKeysData, PgSodiumKeysError, TData>(
    pgSodiumKeys.list(projectRef),
    ({ signal }) => getPgSodiumKeys({ projectRef, connectionString }, signal),
    {
      select(data) {
        return sortBy(data, (k) => Number(new Date(k.created))) as any
      },
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
