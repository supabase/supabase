import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'

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

export const useUserCreateMutation = (
  options: Omit<UseMutationOptions<UserCreateData, unknown, UserCreateVariables>, 'mutationFn'> = {}
) => {
  return useMutation<UserCreateData, unknown, UserCreateVariables>(
    (vars) => createUser(vars),
    options
  )
}
