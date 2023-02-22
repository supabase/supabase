import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { StripeSubscription } from 'components/interfaces/Billing'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { subscriptionKeys } from './keys'

export type ProjectSubscriptionVariables = {
  projectRef?: string
}

export type ProjectSubscriptionResponse = StripeSubscription

export async function getProjectSubscription(
  { projectRef }: ProjectSubscriptionVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await get(`${API_URL}/projects/${projectRef}/subscription`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as ProjectSubscriptionResponse
}

export type ProjectSubscriptionData = Awaited<ReturnType<typeof getProjectSubscription>>
export type ProjectSubscriptionError = unknown

export const useProjectSubscriptionQuery = <TData = ProjectSubscriptionData>(
  { projectRef }: ProjectSubscriptionVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectSubscriptionData, ProjectSubscriptionError, TData> = {}
) =>
  useQuery<ProjectSubscriptionData, ProjectSubscriptionError, TData>(
    subscriptionKeys.subscription(projectRef),
    ({ signal }) => getProjectSubscription({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

export const useProjectSubscriptionPrefetch = ({ projectRef }: ProjectSubscriptionVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(subscriptionKeys.subscription(projectRef), ({ signal }) =>
        getProjectSubscription({ projectRef }, signal)
      )
    }
  }, [projectRef])
}
