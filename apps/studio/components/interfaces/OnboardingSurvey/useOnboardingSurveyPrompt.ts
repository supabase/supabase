import { LOCAL_STORAGE_KEYS } from 'common'
import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import type {
  OnboardingSurveyPromptState,
  OnboardingSurveySurface,
  OnboardingSurveyVariant,
} from './OnboardingSurvey.constants'
import {
  ONBOARDING_SURVEY_EXPERIMENT_ID,
  ORG_KIND_DEFAULT,
  ORG_SIZE_DEFAULT,
  variantMatchesSurface,
} from './OnboardingSurvey.constants'
import { useOnboardingSurveyMutation } from '@/data/organizations/onboarding-survey-mutation'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrackExperimentExposure } from '@/hooks/misc/useTrackExperimentExposure'
import { usePHFlag } from '@/hooks/ui/useFlag'
import { useProfile } from '@/lib/profile'
import { useTrack } from '@/lib/telemetry/track'

type SurveyValues = {
  heard_from?: string
  building?: string
}

type SubmitSurveyOptions = {
  showSuccessToast?: boolean
}

type DismissReason =
  | 'skip_button'
  | 'dialog_dismissed'
  | 'toast_skip'
  | 'org_form_blank'
  | 'close_button'

export const getOnboardingSurveyPromptStorageKey = ({
  orgSlug,
  profileId,
}: {
  orgSlug?: string
  profileId?: string | number
}) => {
  if (!orgSlug || profileId === undefined || profileId === null) {
    return 'supabase-onboarding-survey-unknown'
  }

  return LOCAL_STORAGE_KEYS.ONBOARDING_SURVEY_PROMPT_STATE(String(profileId), orgSlug)
}

export function useOnboardingSurveyPrompt({ surface }: { surface: OnboardingSurveySurface }) {
  const track = useTrack()
  const { profile } = useProfile()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()
  const [open, setOpen] = useState(false)

  const flagValue = usePHFlag<OnboardingSurveyVariant | false>(ONBOARDING_SURVEY_EXPERIMENT_ID)
  const variant: OnboardingSurveyVariant | undefined =
    typeof flagValue === 'string' ? flagValue : undefined

  useTrackExperimentExposure(ONBOARDING_SURVEY_EXPERIMENT_ID, variant)

  const profileId = profile?.gotrue_id ?? profile?.id
  const orgSlug = organization?.slug
  const projectRef = project?.ref

  const storageKey = useMemo(
    () => getOnboardingSurveyPromptStorageKey({ orgSlug, profileId }),
    [orgSlug, profileId]
  )

  const [promptState, setPromptState, { isSuccess: isPromptStateLoaded }] =
    useLocalStorageQuery<OnboardingSurveyPromptState | null>(storageKey, null)

  const mutation = useOnboardingSurveyMutation()
  const hasFiredMutationRef = useRef(false)

  const shouldShowPrompt =
    isPromptStateLoaded &&
    !!orgSlug &&
    (surface !== 'project_home' || !!projectRef) &&
    !!profileId &&
    promptState === null &&
    variantMatchesSurface(variant, surface)

  const openDialog = useCallback(() => {
    if (!shouldShowPrompt) return
    setOpen(true)
  }, [shouldShowPrompt])

  // On project_home surfaces (dialog/toast) the org-creation backend side-effect
  // is skipped, so dismissing without answering would leave no survey row at all.
  // Fire the mutation with default kind/size so the row exists. Single-fire
  // guarded by hasFiredMutationRef.
  const fireDefaultSurvey = useCallback(async () => {
    if (hasFiredMutationRef.current || !orgSlug) return
    hasFiredMutationRef.current = true
    try {
      await mutation.mutateAsync({
        slug: orgSlug,
        kind: ORG_KIND_DEFAULT,
        size: ORG_SIZE_DEFAULT,
      })
    } catch {
      hasFiredMutationRef.current = false
    }
  }, [mutation, orgSlug])

  const dismissPrompt = useCallback(
    (reason: DismissReason = 'dialog_dismissed') => {
      if (!shouldShowPrompt) {
        setOpen(false)
        return
      }

      setPromptState({
        status: 'dismissed',
        updatedAt: new Date().toISOString(),
      })
      setOpen(false)
      track('onboarding_survey_dismissed', { surface, reason })

      if (surface === 'project_home') {
        void fireDefaultSurvey()
      }
    },
    [fireDefaultSurvey, setPromptState, shouldShowPrompt, surface, track]
  )

  const submitSurvey = useCallback(
    async (
      { heard_from, building }: SurveyValues,
      { showSuccessToast = true }: SubmitSurveyOptions = {}
    ) => {
      if (!orgSlug) return false

      const hasHeardFrom = !!heard_from?.trim()
      const hasBuilding = !!building?.trim()

      track('onboarding_survey_submit_button_clicked', { surface, hasHeardFrom, hasBuilding })

      try {
        hasFiredMutationRef.current = true
        await mutation.mutateAsync({
          slug: orgSlug,
          kind: ORG_KIND_DEFAULT,
          size: ORG_SIZE_DEFAULT,
          heard_from,
          building,
        })
        setPromptState({ status: 'submitted', updatedAt: new Date().toISOString() })
        setOpen(false)
        if (showSuccessToast) toast.success('Thanks for sharing')
        return true
      } catch {
        hasFiredMutationRef.current = false
        track('onboarding_survey_submit_failed', { surface, hasHeardFrom, hasBuilding })
        toast.error('Failed to submit. Please try again.')
        return false
      }
    },
    [mutation, orgSlug, setPromptState, surface, track]
  )

  return {
    dismissPrompt,
    isSubmitting: mutation.isPending,
    open,
    openDialog,
    setOpen,
    shouldShowPrompt,
    submitSurvey,
    variant,
  }
}
