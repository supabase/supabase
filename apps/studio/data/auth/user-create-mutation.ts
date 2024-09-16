import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useFlag } from 'hooks/ui/useFlag'
import { post } from 'lib/common/fetch'
import type { ResponseError } from 'types'
import { authKeys } from './keys'

export type UserCreateVariables = {
  projectRef?: string
  protocol: string
  endpoint: string
  serviceApiKey: string
  user: {
    email: string
    password: string
    autoConfirmUser: string
  }
}

export type UserCreateResponse = {
  id: string
  phone: string
  role: string
  updated_at: string
  app_metadata: {
    provider: string
    providers: string[]
  }
  aud: string
  created_at: string
  email: string
  email_confirmed_at: string
  identities: any[]
  user_metadata: any
}

export async function createUser({ protocol, endpoint, serviceApiKey, user }: UserCreateVariables) {
  const response = await post(
    `${protocol}://${endpoint}/auth/v1/admin/users`,
    {
      email: user.email,
      password: user.password,
      email_confirm: user.autoConfirmUser,
    },
    {
      headers: {
        apikey: serviceApiKey,
        Authorization: `Bearer ${serviceApiKey}`,
      },
    }
  )
  if (response.error) {
    throw response.error
  }

  return response
}

type UserCreateData = Awaited<ReturnType<typeof createUser>>

export const useUserCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UserCreateData, ResponseError, UserCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  const userManagementV2 = useFlag('userManagementV2')

  return useMutation<UserCreateData, ResponseError, UserCreateVariables>(
    (vars) => createUser(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        if (userManagementV2) {
          await queryClient.invalidateQueries(authKeys.usersInfinite(projectRef))
        } else {
          await queryClient.invalidateQueries(authKeys.users(projectRef))
        }

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create user: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
