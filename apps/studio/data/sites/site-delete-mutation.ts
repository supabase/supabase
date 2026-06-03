import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError, UseCustomMutationOptions } from '@/types'
import { sitesApiFetch } from './sites-fetch'
import { sitesKeys } from './keys'

export type SiteDeleteVariables = { projectRef: string; slug: string }

export async function deleteSite({ projectRef, slug }: SiteDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  return sitesApiFetch(`/v1/projects/${projectRef}/sites/${slug}`, { method: 'DELETE' })
}

export const useSiteDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<unknown, ResponseError, SiteDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<unknown, ResponseError, SiteDeleteVariables>({
    mutationFn: (vars) => deleteSite(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: sitesKeys.list(variables.projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) toast.error(`Failed to delete site: ${data.message}`)
      else onError(data, variables, context)
    },
    ...options,
  })
}
