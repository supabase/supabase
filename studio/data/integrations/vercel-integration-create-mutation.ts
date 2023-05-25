import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

export type VercelIntegrationCreateVariables = {
  code: string
  configurationId: string
  orgId: number
}

export async function createVercelIntegration({
  code,
  configurationId,
  orgId,
}: VercelIntegrationCreateVariables) {
  const response = await post(`${API_URL}/integrations/vercel`, {
    code,
    configurationId,
    orgId,
  })
  if (response.error) {
    throw response.error
  }

  return response
}

type VercelIntegrationCreateData = Awaited<ReturnType<typeof createVercelIntegration>>

export const useVercelIntegrationCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<VercelIntegrationCreateData, unknown, VercelIntegrationCreateVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<VercelIntegrationCreateData, unknown, VercelIntegrationCreateVariables>(
    (vars) => createVercelIntegration(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
