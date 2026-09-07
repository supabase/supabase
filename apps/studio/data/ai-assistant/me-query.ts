import { queryOptions } from '@tanstack/react-query'

import { assistantMeSchema } from './contracts'
import { assistantFetch } from './fetcher'
import { aiAssistantKeys } from './keys'
import { IS_PLATFORM } from '@/lib/constants'

export type AssistantMeVariables = { userId?: string }
export type AssistantMeData = Awaited<ReturnType<typeof getAssistantMe>>
export type AssistantMeError = Error

async function getAssistantMe({ userId }: AssistantMeVariables, signal?: AbortSignal) {
  if (!userId) throw new Error('User is required')
  return assistantMeSchema.parse(await assistantFetch('/v1/me', {}, signal))
}

export const assistantMeQueryOptions = ({ userId }: AssistantMeVariables) =>
  queryOptions({
    queryKey: aiAssistantKeys.me(userId),
    queryFn: ({ signal }) => getAssistantMe({ userId }, signal),
    enabled: IS_PLATFORM && !!userId,
  })
