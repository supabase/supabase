import { useState } from 'react'
import { toast } from 'sonner'

import { useFlag, useParams } from 'common'
import { CANCELLATION_REASONS } from 'components/interfaces/Billing/Billing.constants'
import { useSendDowngradeFeedbackMutation } from 'data/feedback/exit-survey-send'
import { ProjectInfo } from 'data/projects/projects-query'
import { useOrgSubscriptionUpdateMutation } from 'data/subscriptions/org-subscription-update-mutation'
import { Alert, Button, cn, Input, Modal } from 'ui'
import ProjectUpdateDisabledTooltip from '../ProjectUpdateDisabledTooltip'

export interface ExitSurveyModalProps {
  visible: boolean
  projects: ProjectInfo[]
  onClose: (success?: boolean) => void
}

// [Joshen] For context - Exit survey is only when going to Free Plan from a paid plan
export const ExitSurveyModal = ({ visible, projects, onClose }: ExitSurveyModalProps) => {
  const { slug } = useParams()

  const [message, setMessage] = useState('')
  const [selectedReason, setSelectedReason] = useState<string[]>([])

  const subscriptionUpdateDisabled = useFlag('disableProjectCreationAndUpdate')
  const { mutate: updateOrgSubscription, isLoading: isUpdating } = useOrgSubscriptionUpdateMutation(
    {
      onError: (error) => {
        toast.error(`Failed to downgrade project: ${error.message}`)
      },
    }
  )
  const { mutateAsync: sendExitSurvey, isLoading: isSubmittingFeedback } =
    useSendDowngradeFeedbackMutation()
  const isSubmitting = isUpdating || isSubmittingFeedback

  const projectsWithComputeDowngrade = projects.filter(
    (project) => project.infra_compute_size !== 'nano'
  )

  const hasProjectsWithComputeDowngrade = projectsWithComputeDowngrade.length > 0

  const [shuffledReasons] = useState(() => [
    ...CANCELLATION_REASONS.sort(() => Math.random() - 0.5),
    { value: 'None of the above' },
  ])

  const onSelectCancellationReason = (reason: string) => {
    setSelectedReason([reason])
  }

  // Helper to get label for selected reason
  const getReasonLabel = (reason: string | undefined) => {
    const found = CANCELLATION_REASONS.find((r) => r.value === reason)
    return found?.label || 'What can we improve on?'
  }

  const textareaLabel = getReasonLabel(selectedReason[0])

  const onSubmit = async () => {
    if (selectedReason.length === 0) {
      return toast.error('Please select a reason for canceling your subscription')
    }

    await downgradeOrganization()
  }

  const downgradeOrganization = async () => {
    // Update the subscription first, followed by posting the exit survey if successful
    // If compute instance is present within the existing subscription, then a restart will be triggered
    if (!slug) return console.error('Slug is required')

    updateOrgSubscription(
      { slug, tier: 'tier_free' },
      {
        onSuccess: async () => {
          try {
            await sendExitSurvey({
              orgSlug: slug,
              reasons: selectedReason.reduce((a, b) => `${a}- ${b}\n`, ''),
              message,
              exitAction: 'downgrade',
            })
          } catch (error) {
            // [Joshen] In this case we don't raise any errors if the exit survey fails to send since it shouldn't block the user
          } finally {
            toast.success(
              hasProjectsWithComputeDowngrade
                ? 'Successfully downgraded organization to the Free Plan. Your projects are currently restarting to update their compute instances.'
                : 'Successfully downgraded organization to the Free Plan',
              { duration: hasProjectsWithComputeDowngrade ? 8000 : 4000 }
            )
            onClose(true)
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
          }
        },
      }
    )
  }

  return (
    <Modal hideFooter size="xlarge" visible={visible} onCancel={onClose} header="Help us improve">
      <Modal.Content>
        <div className="space-y-4">
          <p className="text-sm text-foreground-light">
            Share with us why you're downgrading your plan.
          </p>
          <div className="space-y-8 mt-6">
            <div className="flex flex-wrap gap-2" data-toggle="buttons">
              {shuffledReasons.map((option) => {
                const active = selectedReason[0] === option.value
                return (
                  <label
                    key={option.value}
                    className={cn(
                      'flex cursor-pointer items-center space-x-2 rounded-md py-1',
                      'pl-2 pr-3 text-center text-sm',
                      'shadow-sm transition-all duration-100',
                      active
                        ? `bg-foreground text-background opacity-100 hover:bg-opacity-75`
                        : `bg-border-strong text-foreground opacity-75 hover:opacity-100`
                    )}
                  >
                    <input
                      type="radio"
                      name="options"
                      value={option.value}
                      className="hidden"
                      checked={active}
                      onChange={() => onSelectCancellationReason(option.value)}
                    />
                    <div>{option.value}</div>
                  </label>
                )
              })}
            </div>
            <div className="text-area-text-sm flex flex-col gap-y-2">
              <label className="text-sm whitespace-pre-line break-words">{textareaLabel}</label>
              <Input.TextArea
                id="message"
                name="message"
                value={message}
                onChange={(event: any) => setMessage(event.target.value)}
                rows={3}
              />
            </div>
          </div>
          {hasProjectsWithComputeDowngrade && (
            <Alert
              withIcon
              variant="warning"
              title={`${projectsWithComputeDowngrade.length} of your projects will be restarted upon clicking confirm,`}
            >
              This is due to changes in compute instances from the downgrade. Affected projects
              include {projectsWithComputeDowngrade.map((project) => project.name).join(', ')}.
            </Alert>
          )}
        </div>
      </Modal.Content>

      <div className="flex items-center justify-between border-t px-4 py-4">
        <p className="text-xs text-foreground-lighter">
          The unused amount for the remaining time of your billing cycle will be refunded as credits
        </p>

        <div className="flex items-center space-x-2">
          <Button type="default" onClick={() => onClose()}>
            Cancel
          </Button>
          <ProjectUpdateDisabledTooltip projectUpdateDisabled={subscriptionUpdateDisabled}>
            <Button
              type="danger"
              className="pointer-events-auto"
              loading={isSubmitting}
              disabled={subscriptionUpdateDisabled || isSubmitting}
              onClick={onSubmit}
            >
              Confirm downgrade
            </Button>
          </ProjectUpdateDisabledTooltip>
        </div>
      </div>
    </Modal>
  )
}
