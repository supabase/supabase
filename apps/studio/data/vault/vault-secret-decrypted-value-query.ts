import { Query } from '@supabase/pg-meta/src/query'
import { UseQueryOptions, useQuery } from '@tanstack/react-query'
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
  connectionString?: string | null
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
  return result as { decrypted_secret: string }[]
}

type getDecryptedValueResult = Awaited<ReturnType<typeof getDecryptedValue>>
export type VaultSecretsDecryptedValueData = string
export type VaultSecretsDecryptedValueError = unknown

export const useVaultSecretDecryptedValueQuery = <TData = string>(
  { projectRef, connectionString, id }: VaultSecretsDecryptedValueVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<getDecryptedValueResult, VaultSecretsDecryptedValueError, TData> = {}
) =>
  useQuery<getDecryptedValueResult, VaultSecretsDecryptedValueError, TData>(
    vaultSecretsKeys.getDecryptedValue(projectRef, id),
    ({ signal }) => getDecryptedValue({ projectRef, connectionString, id }, signal),
    {
      select(data) {
        return (data[0]?.decrypted_secret ?? '') as TData
      },
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
