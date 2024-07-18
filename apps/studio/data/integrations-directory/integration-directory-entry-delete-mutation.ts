import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationsDirectoryKeys } from './keys'

type IntegrationDirectoryEntryDeleteVariables = {
  orgSlug: string
  entryId: number
}

export async function deleteIntegrationDirectoryEntry({
  entryId,
}: IntegrationDirectoryEntryDeleteVariables) {
  const { data, error } = await del(
    '/platform/organizations/{slug}/integrations-directory/{entry_id}',
    {
      params: {
        path: {
          entry_id: String(entryId),
        },
      },
    }
  )

  if (error) handleError(error)
  return data
}

export type IntegrationDirectoryEntryDeleteData = Awaited<
  ReturnType<typeof deleteIntegrationDirectoryEntry>
>

export const useIntegrationDirectoryEntryDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    IntegrationDirectoryEntryDeleteData,
    ResponseError,
    IntegrationDirectoryEntryDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<
    IntegrationDirectoryEntryDeleteData,
    ResponseError,
    IntegrationDirectoryEntryDeleteVariables
  >((vars) => deleteIntegrationDirectoryEntry(vars), {
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries(
          integrationsDirectoryKeys.integrationsDirectoryList(variables.orgSlug)
        ),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete an entry to Integrations Directory: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
