import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import type { User } from './users-infinite-query'

// UPDATED: Added optional type and options parameters
export type UserSendMagicLinkVariables = {
  projectRef: string
  user: User
  type?: 'magiclink' | 'recovery' | 'signup'  // Added to specify template type
  options?: {
    emailRedirectTo?: string
    shouldCreateUser?: boolean
    data?: {
      template?: string
      [key: string]: any
    }
  }
}

// UPDATED: Modified to include type and options in the request
export async function sendMagicLink({ 
  projectRef, 
  user, 
  type = 'magiclink',  // Default to magiclink
  options 
}: UserSendMagicLinkVariables) {
  // Build request body with proper template specification
  const requestBody: any = { 
    email: user.email,
    type: type  // This tells backend which template to use
  }

  // Add options if provided
  if (options) {
    if (options.emailRedirectTo) {
      requestBody.redirectTo = options.emailRedirectTo
    }
    if (options.shouldCreateUser !== undefined) {
      requestBody.shouldCreateUser = options.shouldCreateUser
    }
    if (options.data) {
      requestBody.data = options.data
    }
  }

  const { data, error } = await post('/platform/auth/{ref}/magiclink', {
    params: { path: { ref: projectRef } },
    body: requestBody,
  })

  if (error) handleError(error)

  return data
}

type UserSendMagicLinkData = Awaited<ReturnType<typeof sendMagicLink>>

export const useUserSendMagicLinkMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UserSendMagicLinkData, ResponseError, UserSendMagicLinkVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<UserSendMagicLinkData, ResponseError, UserSendMagicLinkVariables>(
    (vars) => sendMagicLink(vars),
    {
      async onSuccess(data, variables, context) {
        // [Joshen] If we need to invalidate any queries
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to send magic link: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}