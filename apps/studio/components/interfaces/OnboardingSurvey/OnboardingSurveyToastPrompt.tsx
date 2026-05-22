import { useEffect, useRef } from 'react'
import { Button } from 'ui'

import { OnboardingSurveyDialog } from './OnboardingSurveyDialog'
import { useOnboardingSurveyPrompt } from './useOnboardingSurveyPrompt'
import { BannerCard } from '@/components/ui/BannerStack/BannerCard'
import { BANNER_ID, useBannerStack } from '@/components/ui/BannerStack/BannerStackProvider'
import { useTrack } from '@/lib/telemetry/track'

type OnboardingSurveyToastPromptProps = {
  autoOpen?: boolean
}

const WELCOME_TITLE = 'Welcome to Supabase'

const WELCOME_DESCRIPTION =
  'Answer two optional questions about how you found Supabase and what you are building.'

export function OnboardingSurveyToastPrompt({
  autoOpen = false,
}: OnboardingSurveyToastPromptProps) {
  const track = useTrack()
  const prompt = useOnboardingSurveyPrompt({ surface: 'project_home' })
  const { addBanner, dismissBanner } = useBannerStack()
  const hasAutoOpened = useRef(false)
  const hasTrackedOpened = useRef(false)
  const { dismissPrompt, openDialog, shouldShowPrompt } = prompt

  useEffect(() => {
    if (!shouldShowPrompt || hasTrackedOpened.current) return
    hasTrackedOpened.current = true
    track('onboarding_survey_prompt_opened', { surface: 'project_home' })
  }, [shouldShowPrompt, track])

  useEffect(() => {
    if (!autoOpen || !shouldShowPrompt || hasAutoOpened.current) return

    hasAutoOpened.current = true
    openDialog()
  }, [autoOpen, openDialog, shouldShowPrompt])

  useEffect(() => {
    if (autoOpen || !shouldShowPrompt) {
      dismissBanner(BANNER_ID.ONBOARDING_SURVEY)
      return
    }

    addBanner({
      id: BANNER_ID.ONBOARDING_SURVEY,
      isDismissed: false,
      priority: 1,
      content: (
        <BannerCard
          onDismiss={() => {
            dismissBanner(BANNER_ID.ONBOARDING_SURVEY)
            dismissPrompt('toast_skip')
          }}
        >
          <div className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-1 mb-2">
              <p className="text-sm font-medium">Help improve Supabase</p>
              <p className="text-xs text-foreground-lighter text-balance">
                Answer two optional questions about how you found Supabase and what you are
                building.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="primary"
                size="tiny"
                onClick={() => {
                  dismissBanner(BANNER_ID.ONBOARDING_SURVEY)
                  track('onboarding_survey_answer_button_clicked', { surface: 'project_home' })
                  openDialog()
                }}
              >
                Answer
              </Button>
              <Button
                type="default"
                size="tiny"
                onClick={() => {
                  dismissBanner(BANNER_ID.ONBOARDING_SURVEY)
                  dismissPrompt('toast_skip')
                }}
              >
                Skip
              </Button>
            </div>
          </div>
        </BannerCard>
      ),
    })

    return () => {
      dismissBanner(BANNER_ID.ONBOARDING_SURVEY)
    }
  }, [addBanner, autoOpen, dismissBanner, dismissPrompt, openDialog, shouldShowPrompt, track])

  return (
    <OnboardingSurveyDialog
      open={prompt.open}
      title={autoOpen ? WELCOME_TITLE : undefined}
      description={autoOpen ? WELCOME_DESCRIPTION : undefined}
      isSubmitting={prompt.isSubmitting}
      onDismiss={() => prompt.dismissPrompt('dialog_dismissed')}
      onOpenChange={prompt.setOpen}
      onSkip={() => prompt.dismissPrompt('skip_button')}
      onSubmit={prompt.submitSurvey}
    />
  )
}
