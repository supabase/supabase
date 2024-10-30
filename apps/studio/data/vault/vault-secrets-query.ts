import { UseQueryOptions } from '@tanstack/react-query'
import { Query } from 'components/grid/query/Query'
import type { VaultSecret } from 'types'
import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from '../sql/execute-sql-query'
import { vaultSecretsKeys } from './keys'

export const getVaultSecretsQuery = () => {
  const sql = new Query()
    .from('secrets', 'vault')
    .select('id,name,description,secret,key_id,created_at,updated_at')
    .toSql()

  return sql
}

export type VaultSecretsVariables = {
  projectRef?: string
  connectionString?: string
}

export type VaultSecretsData = VaultSecret[]
export type VaultSecretsError = ExecuteSqlError

export const useVaultSecretsQuery = <TData extends VaultSecretsData = VaultSecretsData>(
  { projectRef, connectionString }: VaultSecretsVariables,
  { enabled, ...options }: UseQueryOptions<ExecuteSqlData, VaultSecretsError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getVaultSecretsQuery(),
      queryKey: vaultSecretsKeys.list(projectRef),
    },
    {
      select(data) {
        return data.result
      },
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
}
