import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type ProjectUpgradeVariables = components['schemas']['UpgradeDatabaseBody'] & {
  ref: string
}

export async function upgradeProject({
  ref,
  target_version,
  release_channel,
}: ProjectUpgradeVariables) {
  const { data, error } = await post('/v1/projects/{ref}/upgrade', {
    params: { path: { ref } },
    body: { target_version: target_version.toString(), release_channel },
  })
  if (error) handleError(error)
  return data
}

type ProjectUpgradeData = Awaited<ReturnType<typeof upgradeProject>>

export const useProjectUpgradeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectUpgradeData, ResponseError, ProjectUpgradeVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ProjectUpgradeData, ResponseError, ProjectUpgradeVariables>(
    (vars) => upgradeProject(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to upgrade project: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
