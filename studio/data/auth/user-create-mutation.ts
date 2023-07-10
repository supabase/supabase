import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import { ResponseError } from 'types'

export type UserCreateVariables = {
  protocol: string
  endpoint: string
  serviceApiKey: string
  user: {
    email: string
    password: string
    autoConfirmUser: string
  }
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
      credentials: 'omit',
    }
  )
  if (response.error) {
    throw response.error
  }

  return response
}

type UserCreateData = Awaited<ReturnType<typeof createUser>>

export const useUserCreateMutation = ({
  onError,
  ...options
}: Omit<
  UseMutationOptions<UserCreateData, ResponseError, UserCreateVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<UserCreateData, ResponseError, UserCreateVariables>(
    (vars) => createUser(vars),
    {
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
