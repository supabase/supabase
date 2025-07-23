import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSqlTitleGenerateMutation } from 'data/ai/sql-title-mutation'
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
  const { mutateAsync: generateSqlTitle } = useSqlTitleGenerateMutation()

  return useMutation({
    mutationFn: async ({ projectRef, id, query, name }: DatabaseTestUpdateVariables) => {
      // Generate AI title if name is not provided
      const finalName = name ?? (await generateSqlTitle({ sql: query })).title

      // This is a mock implementation.
      // In a real scenario, you would update the test in a file or a database table.
      const key = databaseTestsKeys.list(projectRef)
      const currentTests = queryClient.getQueryData<DatabaseTest[]>(key) ?? []
      const updatedTests = currentTests.map((test) =>
        test.id === id ? { ...test, name: finalName, query } : test
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
