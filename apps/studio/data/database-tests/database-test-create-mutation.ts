import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

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

  return useMutation({
    mutationFn: async ({ projectRef, query, name }: DatabaseTestCreateVariables) => {
      // This is a mock implementation.
      // In a real scenario, you would save the test to a file or a database table.
      const key = databaseTestsKeys.list(projectRef)
      const currentTests = queryClient.getQueryData<DatabaseTest[]>(key) ?? []
      const newTest: DatabaseTest = {
        id: uuidv4(),
        name,
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
