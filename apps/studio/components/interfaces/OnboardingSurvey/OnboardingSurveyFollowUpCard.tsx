import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import { isProjectCreationPath } from './OnboardingSurveyFollowUp.utils'
import {
  OnboardingSurveyFollowUpDialog,
  type OnboardingSurveyFollowUpValues,
} from './OnboardingSurveyFollowUpDialog'
import { useOnboardingSurveyFollowUp } from './useOnboardingSurveyFollowUp'
import { BannerCard } from '@/components/ui/BannerStack/BannerCard'
import { BANNER_ID, useBannerStack } from '@/components/ui/BannerStack/BannerStackProvider'
import { useOnboardingSurveyMutation } from '@/data/organizations/onboarding-survey-mutation'
import { useTrack } from '@/lib/telemetry/track'

/**
 * Asks an org's creator the onboarding survey again when they left it blank on
 * the new-org form. Shows as a card in the banner stack for the first five
 * minutes after the org is created; Answer opens the survey dialog.
 */
export function OnboardingSurveyFollowUpCard() {
  const track = useTrack()
  const { isEligible, hasExpired, orgSlug, orgKind, orgSize, resolveFollowUp, reopenFollowUp } =
    useOnboardingSurveyFollowUp()
  const { addBanner, dismissBanner } = useBannerStack()
  const [dialogOrgSlug, setDialogOrgSlug] = useState<string>()
  const isDialogOpen = !!dialogOrgSlug && dialogOrgSlug === orgSlug
  const {
    mutate: submitOnboardingSurvey,
    mutateAsync: submitOnboardingSurveyAsync,
    isPending: isSubmitting,
  } = useOnboardingSurveyMutation()

  // One skip save per org per mount: a failed save puts the follow-up back to
  // pending for the next page load, which would otherwise re-trigger it here.
  const skipSaveOrgSlugs = useRef(new Set<string>())
  const [failedSkipOrgSlugs, setFailedSkipOrgSlugs] = useState<string[]>([])
  const hasFailedSkip = !!orgSlug && failedSkipOrgSlugs.includes(orgSlug)

  // The new-org form sent nothing for a blank survey, so the org's type and size
  // are saved here whether the creator answers, skips, or lets the window close.
  const skipFollowUp = useCallback(
    (reason: 'follow_up_skip' | 'follow_up_closed' | 'follow_up_expired') => {
      if (orgSlug && skipSaveOrgSlugs.current.has(orgSlug)) return

      track('onboarding_survey_dismissed', { surface: 'follow_up', reason })
      resolveFollowUp('dismissed')
      if (orgSlug && orgKind) {
        skipSaveOrgSlugs.current.add(orgSlug)
        submitOnboardingSurveyAsync({ slug: orgSlug, kind: orgKind, size: orgSize }).catch(() => {
          track('onboarding_survey_submit_failed', {
            surface: 'follow_up',
            hasKind: true,
            hasBuilding: false,
            hasCanCode: false,
          })
          setFailedSkipOrgSlugs((previous) => [...previous, orgSlug])
          reopenFollowUp()
        })
      }
    },
    [orgKind, orgSize, orgSlug, reopenFollowUp, resolveFollowUp, submitOnboardingSurveyAsync, track]
  )

  // Only the window closing (or the dialog closing after it) triggers the
  // expiry save, not a change in what the save sends
  const onExpire = useEffectEvent(() => skipFollowUp('follow_up_expired'))
  useEffect(() => {
    if (hasExpired && !isDialogOpen) onExpire()
  }, [hasExpired, isDialogOpen])

  const pathname = usePathname()
  const shouldShowCard =
    isEligible && !hasFailedSkip && !isDialogOpen && !isProjectCreationPath(pathname)

  useEffect(() => {
    if (!shouldShowCard) {
      dismissBanner(BANNER_ID.ONBOARDING_SURVEY_FOLLOW_UP)
      return
    }

    addBanner({
      id: BANNER_ID.ONBOARDING_SURVEY_FOLLOW_UP,
      isDismissed: false,
      priority: 1,
      content: (
        <BannerCard onDismiss={() => skipFollowUp('follow_up_skip')}>
          <div className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-1 mb-2">
              <p className="text-sm font-medium">Help improve Supabase</p>
              <p className="text-xs text-foreground-lighter text-balance">
                Answer a few optional questions about your new organization.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="tiny"
                onClick={() => {
                  track('onboarding_survey_answer_button_clicked', { surface: 'follow_up' })
                  setDialogOrgSlug(orgSlug)
                }}
              >
                Answer
              </Button>
              <Button variant="default" size="tiny" onClick={() => skipFollowUp('follow_up_skip')}>
                Skip
              </Button>
            </div>
          </div>
        </BannerCard>
      ),
    })

    return () => dismissBanner(BANNER_ID.ONBOARDING_SURVEY_FOLLOW_UP)
  }, [addBanner, dismissBanner, orgSlug, shouldShowCard, skipFollowUp, track])

  const handleDialogClose = () => {
    if (isSubmitting) return
    setDialogOrgSlug(undefined)
    skipFollowUp('follow_up_closed')
  }

  const handleSubmit = ({ kind, size, building, can_code }: OnboardingSurveyFollowUpValues) => {
    if (!orgSlug) return

    // Unanswered here, the org keeps the type and size picked on the new-org form
    const answeredKind = kind || orgKind
    const companySize = kind === 'COMPANY' ? size : undefined
    const answeredSize = kind ? companySize : orgSize

    const surveyProperties = {
      surface: 'follow_up' as const,
      hasKind: kind !== '',
      hasBuilding: building !== '',
      hasCanCode: can_code !== '',
    }
    track('onboarding_survey_submit_button_clicked', surveyProperties)

    submitOnboardingSurvey(
      {
        slug: orgSlug,
        kind: answeredKind,
        size: answeredSize,
        building: building || undefined,
        can_code: can_code || undefined,
      },
      {
        onSuccess: () => {
          setDialogOrgSlug(undefined)
          resolveFollowUp('submitted')
          toast.success('Thanks for sharing')
        },
        onError: () => {
          track('onboarding_survey_submit_failed', surveyProperties)
          toast.error('Failed to send your answers. Try again.')
        },
      }
    )
  }

  return (
    <OnboardingSurveyFollowUpDialog
      key={orgSlug}
      open={isDialogOpen}
      isSubmitting={isSubmitting}
      onClose={handleDialogClose}
      onSubmit={handleSubmit}
    />
  )
}
