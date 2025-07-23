import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { databaseTestsKeys } from './database-tests-key'
import { DatabaseTest } from './database-tests-query'

type DatabaseTestDeleteVariables = {
  projectRef: string
  id: string
}

export const useDatabaseTestDeleteMutation = ({
  onSuccess,
}: {
  onSuccess?: () => void
} = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectRef, id }: DatabaseTestDeleteVariables) => {
      // This is a mock implementation.
      // In a real scenario, you would delete the test file or remove it from a database table.
      const key = databaseTestsKeys.list(projectRef)
      const currentTests = queryClient.getQueryData<DatabaseTest[]>(key) ?? []
      const updatedTests = currentTests.filter((test) => test.id !== id)
      queryClient.setQueryData(key, updatedTests)
      return id
    },
    onSuccess: (id) => {
      toast.success(`Test successfully deleted.`)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(`Failed to delete test: ${error.message}`)
    },
  })
}
