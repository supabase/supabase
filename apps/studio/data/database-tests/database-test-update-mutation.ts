import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { upsertContent } from 'data/content/content-upsert-mutation'
import { databaseTestsKeys } from './database-tests-key'

type DatabaseTestUpdateVariables = {
  projectRef: string
  id: string
  query: string
  name: string
  folderId?: string
  ownerId: number
}

export const useDatabaseTestUpdateMutation = ({
  onSuccess,
}: {
  onSuccess?: () => void
} = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectRef,
      id,
      query,
      name,
      folderId,
      ownerId,
    }: DatabaseTestUpdateVariables) => {
      // Prepare payload for upsert
      const payload = {
        id,
        name,
        description: '',
        type: 'sql' as const,
        visibility: 'user' as const,
        folder_id: folderId ?? undefined,
        owner_id: ownerId,
        content: { sql: query },
      }

      await upsertContent({ projectRef, payload })

      // Invalidate cache so that refetch happens
      await queryClient.invalidateQueries(databaseTestsKeys.list(projectRef))

      return { id, name, query }
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
