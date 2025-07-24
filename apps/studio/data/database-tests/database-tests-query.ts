import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { databaseTestsKeys } from './database-tests-key'
import { getSQLSnippetFolders } from 'data/content/sql-folders-query'
import { getSQLSnippetFolderContents } from 'data/content/sql-folder-contents-query'
import { DATABASE_TESTS_FOLDER_NAME } from './database-tests.constants'
import { getContentById } from 'data/content/content-id-query'

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
 * Fetches SQL snippets that live inside a folder named "test".
 * These snippets are considered database tests for a project.
 * The function first retrieves (or verifies the existence of) the
 * "test" folder via the `/content/folders` endpoint, then fetches
 * the snippets that belong to that folder, and finally resolves each
 * snippet's SQL text via `getContentById` so that callers receive the
 * full `query` string required to run the tests.
 */
export async function getDatabaseTests(
  { projectRef }: DatabaseTestsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  /*
   * 1. Locate the folder named "test" (case-insensitive)
   */
  const folderResp = await getSQLSnippetFolders(
    { projectRef, name: DATABASE_TESTS_FOLDER_NAME },
    signal
  )

  const testFolder = folderResp.folders.find(
    (f) => f.name.toLowerCase() === DATABASE_TESTS_FOLDER_NAME.toLowerCase()
  )
  if (!testFolder) return []

  /*
   * 2. Fetch list of contents within that folder via folder contents endpoint
   */
  const folderContentsResp = await getSQLSnippetFolderContents(
    { projectRef, folderId: testFolder.id, sort: 'name' },
    signal
  )

  const contents = (folderContentsResp.contents ?? []) as Array<{
    id: string
    name: string
  }>

  /*
   * 3. Resolve SQL text for each snippet in parallel
   */
  const tests: DatabaseTest[] = await Promise.all(
    contents.map(async (item) => {
      const { content } = await getContentById({ projectRef, id: item.id })
      const sql = (content as any)?.sql ?? ''
      return {
        id: item.id,
        name: item.name,
        query: sql,
      }
    })
  )

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
