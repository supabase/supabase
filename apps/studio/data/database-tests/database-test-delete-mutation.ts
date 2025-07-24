import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteContents } from 'data/content/content-delete-mutation'
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
      await deleteContents({ projectRef, ids: [id] })

      // Invalidate test list cache
      await queryClient.invalidateQueries(databaseTestsKeys.list(projectRef))

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
