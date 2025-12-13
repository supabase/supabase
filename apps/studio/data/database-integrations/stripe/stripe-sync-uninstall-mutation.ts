import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getAccessToken } from 'common'
import { databaseKeys } from 'data/database/keys'
import type { ResponseError } from 'types'
import { stripeSyncKeys } from './keys'

export type StripeSyncUninstallVariables = {
  projectRef: string
  stripeSecretKey?: string
}

export type StripeSyncUninstallResponse = {
  data: { message: string } | null
  error: { message: string } | null
}

export async function uninstallStripeSync({
  projectRef,
  stripeSecretKey,
}: StripeSyncUninstallVariables): Promise<StripeSyncUninstallResponse> {
  const accessToken = await getAccessToken()

  const response = await fetch('/api/integrations/stripe-sync-integration', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      projectRef,
      stripeSecretKey,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error?.message || 'Failed to uninstall Stripe Sync')
  }

  return result
}

type StripeSyncUninstallData = Awaited<ReturnType<typeof uninstallStripeSync>>

export const useStripeSyncUninstallMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<StripeSyncUninstallData, ResponseError, StripeSyncUninstallVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<StripeSyncUninstallData, ResponseError, StripeSyncUninstallVariables>({
    mutationFn: (vars) => uninstallStripeSync(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      // Invalidate schemas query to refresh installation status
      await queryClient.invalidateQueries({
        queryKey: databaseKeys.schemas(projectRef),
      })

      // Also invalidate any stripe sync related queries
      await queryClient.invalidateQueries({
        queryKey: stripeSyncKeys.all,
      })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to uninstall Stripe Sync: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
