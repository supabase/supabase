import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getAccessToken } from 'common'
import { databaseKeys } from 'data/database/keys'
import { BASE_PATH } from 'lib/constants'
import { useTrack } from 'lib/telemetry/track'
import type { ResponseError } from 'types'
import { stripeSyncKeys } from './keys'

export type StripeSyncInstallVariables = {
  projectRef: string
  stripeSecretKey: string
}

export type StripeSyncInstallResponse = {
  data: { message: string } | null
  error: { message: string } | null
}

export async function installStripeSync({
  projectRef,
  stripeSecretKey,
}: StripeSyncInstallVariables): Promise<StripeSyncInstallResponse> {
  const accessToken = await getAccessToken()

  const response = await fetch(`${BASE_PATH}/api/integrations/stripe-sync`, {
    method: 'POST',
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
    throw new Error(result.error?.message || 'Failed to install Stripe Sync')
  }

  return result
}

type StripeSyncInstallData = Awaited<ReturnType<typeof installStripeSync>>

export const useStripeSyncInstallMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<StripeSyncInstallData, ResponseError, StripeSyncInstallVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  const track = useTrack()

  return useMutation<StripeSyncInstallData, ResponseError, StripeSyncInstallVariables>({
    mutationFn: (vars) => installStripeSync(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      track('integration_install_started', {
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
        toast.error(`Failed to install Stripe Sync: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
