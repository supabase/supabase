import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationKeys } from './keys'

type UpdateVariables = {
  connectionId: string | number
  organizationId: number
  workdir: string
  supabaseChangesOnly: boolean
  branchLimit: number
}

export async function updateConnection(
  { connectionId, workdir, supabaseChangesOnly, branchLimit }: UpdateVariables,
  signal?: AbortSignal
) {
  const { data, error } = await patch('/platform/integrations/github/connections/{connection_id}', {
    params: { path: { connection_id: String(connectionId) } },
    signal,
    body: { workdir, supabase_changes_only: supabaseChangesOnly, branch_limit: branchLimit },
  })

  if (error) handleError(error)
  return data
}

type UpdateContentData = Awaited<ReturnType<typeof updateConnection>>

export const useGitHubConnectionUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UpdateContentData, ResponseError, UpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<UpdateContentData, ResponseError, UpdateVariables>(
    (args) => updateConnection(args),
    {
      async onSuccess(data, variables, context) {
        await Promise.all([
          queryClient.invalidateQueries(
            integrationKeys.githubConnectionsList(variables.organizationId)
          ),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update Github connection: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
