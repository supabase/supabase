import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { assistantProjectPermissionsSchema } from './contracts'
import { assistantFetch } from './fetcher'
import { aiAssistantKeys } from './keys'
import { useAssistantSupabaseBackend } from '@/lib/assistant/backend'

export const projectPermissionsQueryOptions = (projectRef?: string, orgSlug?: string) =>
  queryOptions({
    queryKey: aiAssistantKeys.projectPermissions(projectRef, orgSlug),
    queryFn: async ({ signal }) => {
      if (!projectRef || !orgSlug) throw new Error('Project and organization are required')
      return assistantProjectPermissionsSchema.parse(
        await assistantFetch(
          `/v1/projects/${encodeURIComponent(projectRef)}/permissions?org_slug=${encodeURIComponent(orgSlug)}`,
          {},
          signal
        )
      )
    },
  })

export function useAssistantProjectPermissions(
  projectRef?: string,
  orgSlug?: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  const isEnabled = useAssistantSupabaseBackend()
  return useQuery({
    ...projectPermissionsQueryOptions(projectRef, orgSlug),
    enabled: enabled && isEnabled && !!projectRef && !!orgSlug,
  })
}

export function useUpdateAssistantProjectPermissions(projectRef?: string, orgSlug?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      selection,
      consentVersion,
    }: {
      selection: string
      consentVersion: number
    }) => {
      if (!projectRef || !orgSlug) throw new Error('Project and organization are required')
      return assistantProjectPermissionsSchema.parse(
        await assistantFetch(`/v1/projects/${encodeURIComponent(projectRef)}/permissions`, {
          method: 'POST',
          body: JSON.stringify({
            org_slug: orgSlug,
            selection,
            consentVersion,
          }),
        })
      )
    },
    onSuccess: (data) => {
      queryClient.setQueryData(projectPermissionsQueryOptions(projectRef, orgSlug).queryKey, data)
      toast.success('Assistant permissions updated')
    },
    onError: (error) => toast.error(error.message),
  })
}
