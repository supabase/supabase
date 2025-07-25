import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'

import type { DatabaseTest } from './database-tests-query'
import { databaseTestsKeys } from './database-tests-key'

export interface DatabaseTestVariables {
  projectRef?: string
  id?: string
}

export async function getDatabaseTest(
  { projectRef, id }: DatabaseTestVariables,
  signal?: AbortSignal
): Promise<DatabaseTest | undefined> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('id is required')

  const { data, error } = await get('/v1/projects/{ref}/snippets/{id}', {
    params: { path: { ref: projectRef, id } },
    signal,
  })

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    query: (data.content as any)?.sql ?? '',
  }
}

export type DatabaseTestData = Awaited<ReturnType<typeof getDatabaseTest>>
export type DatabaseTestError = unknown

export const useDatabaseTestQuery = <TData = DatabaseTestData>(
  { projectRef, id }: DatabaseTestVariables,
  { enabled = true, ...options }: UseQueryOptions<DatabaseTestData, DatabaseTestError, TData> = {}
) =>
  useQuery<DatabaseTestData, DatabaseTestError, TData>(
    databaseTestsKeys.detail(projectRef, id),
    ({ signal }) => getDatabaseTest({ projectRef, id }, signal),
    { enabled: enabled && !!projectRef && !!id, ...options }
  )
