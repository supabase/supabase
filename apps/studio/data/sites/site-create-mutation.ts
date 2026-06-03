import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { Site, SiteTlsMode } from '@/lib/api/self-hosted/hosting/types'
import type { ResponseError, UseCustomMutationOptions } from '@/types'
import { sitesApiFetch } from './sites-fetch'
import { sitesKeys } from './keys'

export type SiteCreateVariables = {
  projectRef: string
  slug: string
  domain: string
  spaFallback?: boolean
  tls?: SiteTlsMode
  apiProxy?: boolean
}

export type SiteCreateResponse = Site & { agentApplied?: boolean; agentError?: string }

export async function createSite({ projectRef, ...body }: SiteCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  return sitesApiFetch<SiteCreateResponse>(`/v1/projects/${projectRef}/sites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export const useSiteCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<SiteCreateResponse, ResponseError, SiteCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<SiteCreateResponse, ResponseError, SiteCreateVariables>({
    mutationFn: (vars) => createSite(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: sitesKeys.list(variables.projectRef) })
      // Surface a warning when the site is registered but nginx wasn't reloaded.
      if (data?.agentApplied === false) {
        toast.warning(
          `Site created, but nginx wasn't updated: ${data.agentError ?? 'hosting agent unavailable'}`
        )
      }
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) toast.error(`Failed to create site: ${data.message}`)
      else onError(data, variables, context)
    },
    ...options,
  })
}
