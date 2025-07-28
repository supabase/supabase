import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { put, handleError } from 'data/fetchers'
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
      const payload: any = {
        id,
        name,
        description: '',
        type: 'test' as any,
        visibility: 'project' as const,
        // folder_id no longer used for tests
        folder_id: undefined,
        owner_id: ownerId,
        content: { sql: query },
      }

      const { data, error } = await put('/v1/projects/{ref}/snippets/{id}', {
        params: { path: { ref: projectRef, id } },
        body: payload,
      })

      if (error) handleError(error)

      // Invalidate caches so that refetch happens for both the list and the specific test detail
      await Promise.all([
        queryClient.invalidateQueries(databaseTestsKeys.list(projectRef)),
        queryClient.invalidateQueries(databaseTestsKeys.detail(projectRef, id)),
      ])

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
