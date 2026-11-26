import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from '@/data/fetchers'
import { useInvalidateFreeProjectLimitChecks } from '@/data/organizations/free-project-limit-check-query'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type ProjectPauseVariables = {
  ref: string
}

export async function pauseProject({ ref }: ProjectPauseVariables) {
  const { data, error } = await post('/platform/projects/{ref}/pause', {
    params: { path: { ref } },
  })
  if (error) handleError(error)
  return data
}

type ProjectPauseData = Awaited<ReturnType<typeof pauseProject>>

export const useProjectPauseMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ProjectPauseData, StudioError, ProjectPauseVariables>,
  'mutationFn'
> = {}) => {
  const { invalidateFreeProjectLimitChecks } = useInvalidateFreeProjectLimitChecks()

  return useMutation<ProjectPauseData, StudioError, ProjectPauseVariables>({
    mutationFn: (vars) => pauseProject(vars),
    async onSuccess(data, variables, context) {
      await invalidateFreeProjectLimitChecks()
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to pause project: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
