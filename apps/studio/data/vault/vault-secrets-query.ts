import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { Query } from 'components/grid/query/Query'
import type { VaultSecret } from 'types'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { vaultSecretsKeys } from './keys'

export const getVaultSecretsSql = () => {
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

export async function getVaultSecrets(
  { projectRef, connectionString }: VaultSecretsVariables,
  signal?: AbortSignal
) {
  const sql = getVaultSecretsSql()

  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['vault-secrets'] },
    signal
  )

  return result as VaultSecret[]
}

export type VaultSecretsData = Awaited<ReturnType<typeof getVaultSecrets>>
export type VaultSecretsError = ExecuteSqlError

export const useVaultSecretsQuery = <TData = VaultSecretsData>(
  { projectRef, connectionString }: VaultSecretsVariables,
  { enabled = true, ...options }: UseQueryOptions<VaultSecretsData, VaultSecretsError, TData> = {}
) =>
  useQuery<VaultSecretsData, VaultSecretsError, TData>(
    vaultSecretsKeys.list(projectRef),
    ({ signal }) => getVaultSecrets({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
