import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from 'common'
import { toast } from 'sonner'

import { stripeSyncKeys } from './keys'
import { databaseKeys } from '@/data/database/keys'
import { BASE_PATH } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'
import type { ResponseError } from '@/types'

export type StripeSyncUninstallVariables = {
  projectRef: string
  startTime: number
}

export type StripeSyncUninstallResponse = {
  data: { message: string } | null
  error: { message: string } | null
}

export async function uninstallStripeSync({
  projectRef,
  startTime,
}: StripeSyncUninstallVariables): Promise<StripeSyncUninstallResponse> {
  const accessToken = await getAccessToken()

  const response = await fetch(`${BASE_PATH}/api/integrations/stripe-sync`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      projectRef,
      startTime,
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
  const track = useTrack()

  return useMutation<StripeSyncUninstallData, ResponseError, StripeSyncUninstallVariables>({
    mutationFn: (vars) => uninstallStripeSync(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      track('integration_uninstall_submitted', {
        integrationName: 'stripe_sync_engine',
      })

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
