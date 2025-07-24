import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { uuidv4 } from 'lib/helpers'
// Content helpers
import { insertContent, InsertContentPayload } from 'data/content/content-insert-mutation'
import { getSQLSnippetFolders } from 'data/content/sql-folders-query'
import { createSQLSnippetFolder } from 'data/content/sql-folder-create-mutation'
import { DATABASE_TESTS_FOLDER_NAME } from './database-tests.constants'
import { databaseTestsKeys } from './database-tests-key'

type DatabaseTestCreateVariables = {
  projectRef: string
  query: string
  name: string
  connectionString?: string // preserved for API compatibility, currently unused
}

export const useDatabaseTestCreateMutation = ({
  onSuccess,
}: {
  onSuccess?: () => void
} = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectRef, query, name }: DatabaseTestCreateVariables) => {
      // 1. Ensure "test" folder exists
      const folderResp = await getSQLSnippetFolders({
        projectRef,
        name: DATABASE_TESTS_FOLDER_NAME,
      })
      let testFolder = folderResp.folders.find(
        (f) => f.name.toLowerCase() === DATABASE_TESTS_FOLDER_NAME.toLowerCase()
      )

      if (!testFolder) {
        // create the folder if it doesn't exist
        testFolder = await createSQLSnippetFolder({ projectRef, name: DATABASE_TESTS_FOLDER_NAME })
      }

      // 2. Insert the content as a SQL snippet under the test folder
      const payload: InsertContentPayload = {
        id: uuidv4(),
        name,
        description: '',
        type: 'sql',
        visibility: 'user',
        folder_id: testFolder.id,
        content: { sql: query },
      }

      const data = await insertContent({ projectRef, payload })

      // Invalidate cached lists so UI refreshes
      await queryClient.invalidateQueries(databaseTestsKeys.list(projectRef))

      return { id: data.id, name: data.name, query }
    },
    onSuccess: (newTest) => {
      toast.success(`Test "${newTest.name}" created.`)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(`Failed to create test: ${error.message}`)
    },
  })
}
