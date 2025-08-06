import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { databaseTestsKeys } from './database-tests-key'
import { get } from 'data/fetchers'

export type DatabaseTest = {
  id: string
  name: string
  query: string
}

export type DatabaseTestsVariables = {
  projectRef?: string
  connectionString?: string
}

/*
 * Fetches SQL snippets that are of type "test" and are visible to the project.
 */
export async function getDatabaseTests(
  { projectRef }: DatabaseTestsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/v1/projects/{ref}/snippets', {
    params: {
      path: { ref: projectRef },
      query: {
        type: 'test',
        sort_by: 'name',
        visibility: 'project',
        sort_order: 'asc',
        limit: '100',
      },
    },
    signal,
  })

  if (error) throw error

  const contents = (data.data ?? []) as unknown as Array<{
    id: string
    name: string
    content: { sql: string }
  }>

  const tests: DatabaseTest[] = contents.map((item) => ({
    id: item.id,
    name: item.name,
    query: item.content?.sql ?? '',
  }))

  return tests
}

export type DatabaseTestsData = Awaited<ReturnType<typeof getDatabaseTests>>
export type DatabaseTestsError = unknown

export const useDatabaseTestsQuery = <TData = DatabaseTestsData>(
  { projectRef, connectionString }: DatabaseTestsVariables,
  { enabled = true, ...options }: UseQueryOptions<DatabaseTestsData, DatabaseTestsError, TData> = {}
) =>
  useQuery<DatabaseTestsData, DatabaseTestsError, TData>(
    databaseTestsKeys.list(projectRef),
    ({ signal }) => getDatabaseTests({ projectRef, connectionString }, signal),
    {
      staleTime: 0,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      ...options,
    }
  )
