import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSqlTitleGenerateMutation } from 'data/ai/sql-title-mutation'
import { uuidv4 } from 'lib/helpers'
import { databaseTestsKeys } from './database-tests-key'
import { DatabaseTest } from './database-tests-query'

type DatabaseTestCreateVariables = {
  projectRef: string
  connectionString?: string
  query: string
}

export const useDatabaseTestCreateMutation = ({
  onSuccess,
}: {
  onSuccess?: () => void
} = {}) => {
  const queryClient = useQueryClient()
  const { mutateAsync: generateSqlTitle } = useSqlTitleGenerateMutation()

  return useMutation({
    mutationFn: async ({ projectRef, query }: DatabaseTestCreateVariables) => {
      // AI title generation
      const { title } = await generateSqlTitle({ sql: query })

      // This is a mock implementation.
      // In a real scenario, you would save the test to a file or a database table.
      const key = databaseTestsKeys.list(projectRef)
      const currentTests = queryClient.getQueryData<DatabaseTest[]>(key) ?? []
      const newTest: DatabaseTest = {
        id: uuidv4(),
        name: title,
        query,
      }
      queryClient.setQueryData(key, [...currentTests, newTest])
      return newTest
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
