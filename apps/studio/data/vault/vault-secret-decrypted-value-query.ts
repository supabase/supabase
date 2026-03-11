import { Query } from '@supabase/pg-meta/src/query'
import { useQuery } from '@tanstack/react-query'
import { UseCustomQueryOptions } from 'types'

import { executeSql } from '../sql/execute-sql-query'
import { vaultSecretsKeys } from './keys'

const vaultSecretDecryptedValueQuery = (id: string) => {
  const sql = new Query()
    .from('decrypted_secrets', 'vault')
    .select('decrypted_secret')
    .match({ id })
    .toSql()

  return sql
}

const vaultSecretDecryptedValuesQuery = (ids: string[]) => {
  const sql = new Query()
    .from('decrypted_secrets', 'vault')
    .select('id,decrypted_secret')
    .filter('id', 'in', ids)
    .toSql()

  return sql
}

export type VaultSecretsDecryptedValueVariables = {
  projectRef?: string
  connectionString?: string | null
  id?: string
}

export const getDecryptedValue = async (
  { projectRef, connectionString, id }: VaultSecretsDecryptedValueVariables,
  signal?: AbortSignal
) => {
  if (!id) throw new Error('ID is required')

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
  }: UseCustomQueryOptions<getDecryptedValueResult, VaultSecretsDecryptedValueError, TData> = {}
) =>
  useQuery<getDecryptedValueResult, VaultSecretsDecryptedValueError, TData>({
    queryKey: vaultSecretsKeys.getDecryptedValue(projectRef, id),
    queryFn: ({ signal }) => getDecryptedValue({ projectRef, connectionString, id }, signal),
    select(data) {
      return (data[0]?.decrypted_secret ?? '') as TData
    },
    enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
    ...options,
  })

// [Joshen] Considering to consolidate fetching single and multiple decrypted values by just passing in a string array
// This is currently used in ImportForeignSchemaDialog, but reckon EditWrapperSheet can use this too to replace the useEffect on L153
// which fetches all the decrypted secrets
export const getDecryptedValues = async (
  {
    projectRef,
    connectionString,
    ids,
  }: {
    projectRef?: string
    connectionString?: string | null
    ids: string[]
  },
  signal?: AbortSignal
) => {
  const sql = vaultSecretDecryptedValuesQuery(ids)
  const { result } = await executeSql<{ id: string; decrypted_secret: string }[]>(
    { projectRef, connectionString, sql },
    signal
  )
  return result.reduce(
    (a, b) => {
      return { ...a, [b.id]: b.decrypted_secret }
    },
    {} as Record<string, string>
  )
}
