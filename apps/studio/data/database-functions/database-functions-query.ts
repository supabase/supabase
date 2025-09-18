import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { databaseKeys } from 'data/database/keys'
import type { ResponseError } from 'types'
import { DatabaseFunctionsVariables, getDatabaseFunctions, pgMetaFunctionsList } from './fetchers'

export type DatabaseFunctionsData = z.infer<typeof pgMetaFunctionsList.zod>
export type DatabaseFunctionsError = ResponseError

export const useDatabaseFunctionsQuery = <TData = DatabaseFunctionsData>(
  { projectRef, connectionString }: DatabaseFunctionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseFunctionsData, DatabaseFunctionsError, TData> = {}
) =>
  useQuery<DatabaseFunctionsData, DatabaseFunctionsError, TData>(
    databaseKeys.databaseFunctions(projectRef),
    ({ signal }) => getDatabaseFunctions({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
