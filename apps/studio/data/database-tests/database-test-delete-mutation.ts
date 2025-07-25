import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import { databaseTestsKeys } from './database-tests-key'

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
      const { data, error } = await del('/v1/projects/{ref}/snippets/{id}', {
        params: { path: { ref: projectRef, id } },
      })

      if (error) handleError(error)

      // Invalidate test list cache
      await queryClient.invalidateQueries(databaseTestsKeys.list(projectRef))

      return data ?? id
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
