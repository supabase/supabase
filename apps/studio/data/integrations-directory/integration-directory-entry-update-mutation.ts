import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { handleError, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationsDirectoryKeys } from './keys'
import type { components } from 'api-types'

type IntegrationDirectoryEntryUpdateVariables = {
  orgSlug: string
  params: components['schemas']['OrgIntegrationsDirectoryRequestBody']
}

export async function updateIntegrationDirectoryEntry({
  orgSlug,
  params,
}: IntegrationDirectoryEntryUpdateVariables) {
  const { data, error } = await put('/platform/organizations/{slug}/integrations-directory', {
    params: { path: { slug: orgSlug } },
    body: params,
  })

  if (error) handleError(error)
  return data
}

export type IntegrationDirectoryEntryUpdateData = Awaited<
  ReturnType<typeof updateIntegrationDirectoryEntry>
>

export const useIntegrationDirectoryEntryUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    IntegrationDirectoryEntryUpdateData,
    ResponseError,
    IntegrationDirectoryEntryUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<
    IntegrationDirectoryEntryUpdateData,
    ResponseError,
    IntegrationDirectoryEntryUpdateVariables
  >((vars) => updateIntegrationDirectoryEntry(vars), {
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
        toast.error(`Failed to add an entry to Integrations Directory: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
