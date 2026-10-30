import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

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
export function OnboardingSurveyFollowUpPrompt() {
  const track = useTrack()
  const { isEligible, orgSlug, resolveFollowUp } = useOnboardingSurveyFollowUp()
  const { addBanner, dismissBanner } = useBannerStack()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { mutate: submitOnboardingSurvey, isPending: isSubmitting } = useOnboardingSurveyMutation()

  const shouldShowCard = isEligible && !isDialogOpen

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
        <BannerCard
          onDismiss={() => {
            track('onboarding_survey_dismissed', {
              surface: 'follow_up',
              reason: 'follow_up_skip',
            })
            resolveFollowUp('dismissed')
          }}
        >
          <div className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-1 mb-2">
              <p className="text-sm font-medium">Help improve Supabase</p>
              <p className="text-xs text-foreground-lighter text-balance">
                Answer two optional questions about your new organization.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="tiny"
                onClick={() => {
                  track('onboarding_survey_answer_button_clicked', { surface: 'follow_up' })
                  setIsDialogOpen(true)
                }}
              >
                Answer
              </Button>
              <Button
                variant="default"
                size="tiny"
                onClick={() => {
                  track('onboarding_survey_dismissed', {
                    surface: 'follow_up',
                    reason: 'follow_up_skip',
                  })
                  resolveFollowUp('dismissed')
                }}
              >
                Skip
              </Button>
            </div>
          </div>
        </BannerCard>
      ),
    })

    return () => dismissBanner(BANNER_ID.ONBOARDING_SURVEY_FOLLOW_UP)
  }, [addBanner, dismissBanner, resolveFollowUp, shouldShowCard, track])

  const handleDialogDismiss = () => {
    setIsDialogOpen(false)
    track('onboarding_survey_dismissed', { surface: 'follow_up', reason: 'follow_up_closed' })
    resolveFollowUp('dismissed')
  }

  const handleSubmit = ({ kind, size, building }: OnboardingSurveyFollowUpValues) => {
    if (!orgSlug) return

    const surveyProperties = {
      surface: 'follow_up' as const,
      hasKind: kind !== '',
      hasBuilding: building.trim() !== '',
    }
    track('onboarding_survey_submit_button_clicked', surveyProperties)

    submitOnboardingSurvey(
      {
        slug: orgSlug,
        kind: kind || undefined,
        size: kind === 'COMPANY' ? size : undefined,
        building,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false)
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
      open={isDialogOpen}
      isSubmitting={isSubmitting}
      onOpenChange={(open) => {
        if (!open) handleDialogDismiss()
      }}
      onSkip={handleDialogDismiss}
      onSubmit={handleSubmit}
    />
  )
}
