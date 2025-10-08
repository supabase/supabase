import { getCheckPrimaryKeysExistsSQL } from '@supabase/pg-meta/src/sql/studio/check-primary-keys-exists'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseKeys } from './keys'

type CheckPrimaryKeysExistsVariables = {
  projectRef?: string
  connectionString?: string | null
  tables: { name: string; schema: string }[]
}

type CheckPrimaryKeysExistResponse = {
  id: string
  name: string
  schema: string
  has_primary_key: boolean
}[]

export async function checkPrimaryKeysExists({
  projectRef,
  connectionString,
  tables,
}: CheckPrimaryKeysExistsVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: getCheckPrimaryKeysExistsSQL(tables),
  })

  return {
    offendingTables: (result as CheckPrimaryKeysExistResponse).filter((x) => !x.has_primary_key),
  }
}

export type CheckPrimaryKeysExistsData = Awaited<ReturnType<typeof checkPrimaryKeysExists>>
export type CheckPrimaryKeysExistsError = ResponseError

export const useCheckPrimaryKeysExists = <TData = CheckPrimaryKeysExistsData>(
  { projectRef, connectionString, tables }: CheckPrimaryKeysExistsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<CheckPrimaryKeysExistsData, CheckPrimaryKeysExistsError, TData> = {}
) =>
  useQuery<CheckPrimaryKeysExistsData, CheckPrimaryKeysExistsError, TData>(
    databaseKeys.checkPrimaryKeysExists(projectRef, tables),
    () => checkPrimaryKeysExists({ projectRef, connectionString, tables }),
    {
      retry: false,
      enabled: enabled && typeof projectRef !== 'undefined' && tables.length > 0,
      ...options,
    }
  )
