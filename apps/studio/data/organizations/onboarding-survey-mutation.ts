import { useMutation } from '@tanstack/react-query'
import type { components } from 'api-types'

import { handleError, post } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

// `can_code` is missing from api-types until they are regenerated from the production spec
export type OnboardingSurveyBody = components['schemas']['OnboardingSurveyBody'] & {
  can_code?: string
}

export type OnboardingSurveyVariables = {
  slug: string
  kind?: string
  size?: string
  building?: string
  can_code?: string
}

const trim = (v?: string) => v?.trim() || undefined

function buildOnboardingSurveyPayload({
  slug,
  kind,
  size,
  building,
  can_code,
}: OnboardingSurveyVariables): OnboardingSurveyBody {
  return {
    slug,
    kind: trim(kind),
    size: trim(size),
    building: trim(building),
    can_code: trim(can_code),
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

export const useOnboardingSurveyMutation = (
  options: Omit<
    UseCustomMutationOptions<SubmitOnboardingSurveyData, StudioError, OnboardingSurveyVariables>,
    'mutationFn'
  > = {}
) => {
  return useMutation<SubmitOnboardingSurveyData, StudioError, OnboardingSurveyVariables>({
    mutationFn: submitOnboardingSurvey,
    ...options,
  })
}
