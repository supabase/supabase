import { useMutation } from '@tanstack/react-query'
import type { components } from 'api-types'

import { handleError, post } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type OnboardingSurveyBody = components['schemas']['OnboardingSurveyBody']

export type OnboardingSurveyVariables = {
  slug: string
  kind?: string
  size?: string
  building?: string
}

const trim = (v?: string) => v?.trim() || undefined

export function buildOnboardingSurveyPayload({
  slug,
  kind,
  size,
  building,
}: OnboardingSurveyVariables): OnboardingSurveyBody {
  return {
    slug,
    kind: trim(kind),
    size: trim(size),
    building: trim(building),
  }
}

export async function submitOnboardingSurvey(variables: OnboardingSurveyVariables) {
  const payload = buildOnboardingSurveyPayload(variables)

  if (!payload.slug) {
    throw new Error('Organization slug is required')
  }

  const { error } = await post('/platform/organizations/onboarding-survey', {
    body: payload,
  })

  if (error) handleError(error)
}

type SubmitOnboardingSurveyData = Awaited<ReturnType<typeof submitOnboardingSurvey>>

export const useOnboardingSurveyMutation = ({
  ...options
}: Omit<
  UseCustomMutationOptions<SubmitOnboardingSurveyData, StudioError, OnboardingSurveyVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<SubmitOnboardingSurveyData, StudioError, OnboardingSurveyVariables>({
    mutationFn: (vars) => submitOnboardingSurvey(vars),
    ...options,
  })
}
