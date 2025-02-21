import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { Query } from 'components/grid/query/Query'
import { executeSql } from '../sql/execute-sql-query'
import { vaultSecretsKeys } from './keys'

export const vaultSecretDecryptedValueQuery = (id: string) => {
  const sql = new Query()
    .from('decrypted_secrets', 'vault')
    .select('decrypted_secret')
    .match({ id })
    .toSql()

  return sql
}

export type VaultSecretsDecryptedValueVariables = {
  projectRef?: string
  connectionString?: string
  id: string
}

export const getDecryptedValue = async (
  { projectRef, connectionString, id }: VaultSecretsDecryptedValueVariables,
  signal?: AbortSignal
) => {
  const sql = vaultSecretDecryptedValueQuery(id)
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: vaultSecretsKeys.getDecryptedValue(projectRef, id),
    },
    signal
  )
  return result
}

export type VaultSecretsDecryptedValueData = string
export type VaultSecretsDecryptedValueError = unknown

export const useVaultSecretDecryptedValueQuery = <TData = VaultSecretsDecryptedValueData>(
  { projectRef, connectionString, id }: VaultSecretsDecryptedValueVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<VaultSecretsDecryptedValueData, VaultSecretsDecryptedValueError, TData> = {}
) =>
  useQuery<VaultSecretsDecryptedValueData, VaultSecretsDecryptedValueError, TData>(
    vaultSecretsKeys.getDecryptedValue(projectRef, id),
    ({ signal }) => getDecryptedValue({ projectRef, connectionString, id }, signal),
    {
      select(data) {
        return (data[0] as any).decrypted_secret
      },
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
