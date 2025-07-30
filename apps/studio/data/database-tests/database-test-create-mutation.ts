import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Content helpers
import { post } from 'data/fetchers'
// Folder logic removed
import { databaseTestsKeys } from './database-tests-key'

type DatabaseTestCreateVariables = {
  projectRef: string
  query: string
  name: string
}

export const useDatabaseTestCreateMutation = ({
  onSuccess,
}: {
  onSuccess?: () => void
} = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectRef, query, name }: DatabaseTestCreateVariables) => {
      // Insert the content as a test snippet
      const data: any = await post('/v1/projects/{ref}/snippets', {
        params: { path: { ref: projectRef } },
        body: {
          name,
          description: '',
          type: 'test',
          visibility: 'project',
          content: { sql: query },
        },
      })

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
