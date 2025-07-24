import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { databaseTestsKeys } from './database-tests-key'
import { DatabaseTest } from './database-tests-query'

type DatabaseTestUpdateVariables = {
  projectRef: string
  id: string
  query: string
  name?: string
}

export const useDatabaseTestUpdateMutation = ({
  onSuccess,
}: {
  onSuccess?: () => void
} = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectRef, id, query, name }: DatabaseTestUpdateVariables) => {
      const key = databaseTestsKeys.list(projectRef)
      const currentTests = queryClient.getQueryData<DatabaseTest[]>(key) ?? []
      const updatedTests = currentTests.map((test) =>
        test.id === id ? { ...test, name, query } : test
      )
      queryClient.setQueryData(key, updatedTests)

      const updatedTest = updatedTests.find((test) => test.id === id)
      return updatedTest!
    },
    onSuccess: (updatedTest) => {
      toast.success(`Test "${updatedTest.name}" updated.`)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(`Failed to update test: ${error.message}`)
    },
  })
}
