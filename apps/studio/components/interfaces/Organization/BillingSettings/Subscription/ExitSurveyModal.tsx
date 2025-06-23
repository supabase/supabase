import { includes, without } from 'lodash'
import { useReducer, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useSendDowngradeFeedbackMutation } from 'data/feedback/exit-survey-send'
import { useOrgSubscriptionUpdateMutation } from 'data/subscriptions/org-subscription-update-mutation'
import { useFlag } from 'hooks/ui/useFlag'
import { Alert, Button, Input, Modal } from 'ui'
import type { ProjectInfo } from '../../../../../data/projects/projects-query'
import { CANCELLATION_REASONS } from '../BillingSettings.constants'
import ProjectUpdateDisabledTooltip from '../ProjectUpdateDisabledTooltip'

export interface ExitSurveyModalProps {
  visible: boolean
  projects: ProjectInfo[]
  onClose: (success?: boolean) => void
}

// [Joshen] For context - Exit survey is only when going to Free Plan from a paid plan
const ExitSurveyModal = ({ visible, projects, onClose }: ExitSurveyModalProps) => {
  const { slug } = useParams()

  const [message, setMessage] = useState('')
  const [selectedReasons, dispatchSelectedReasons] = useReducer(reducer, [])

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

  function reducer(state: any, action: any) {
    if (includes(state, action.target.value)) {
      return without(state, action.target.value)
    } else {
      return [...state, action.target.value]
    }
  }

  const onSubmit = async () => {
    if (selectedReasons.length === 0) {
      return toast.error('Please select at least one reason for canceling your subscription')
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
              reasons: selectedReasons.reduce((a, b) => `${a}- ${b}\n`, ''),
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
    <>
      <Modal
        hideFooter
        size="xlarge"
        visible={visible}
        onCancel={onClose}
        header="Help us improve."
      >
        <Modal.Content>
          <div className="space-y-4">
            <p className="text-sm text-foreground-light">
              We always strive to improve Supabase as much as we can. Please let us know the reasons
              you are canceling your subscription so that we can improve in the future.
            </p>
            <div className="space-y-8 mt-6">
              <div className="flex flex-wrap gap-2" data-toggle="buttons">
                {CANCELLATION_REASONS.map((option) => {
                  const active = selectedReasons.find((x) => x === option)
                  return (
                    <label
                      key={option}
                      className={`
                      flex cursor-pointer items-center space-x-2 rounded-md py-1 
                      pl-2 pr-3 text-center text-sm
                      shadow-sm transition-all duration-100
                      ${
                        active
                          ? ` bg-foreground text-background opacity-100 hover:bg-opacity-75`
                          : ` bg-border-strong text-foreground opacity-25 hover:opacity-50`
                      }
                  `}
                    >
                      <input
                        type="checkbox"
                        name="options"
                        value={option}
                        className="hidden"
                        onClick={dispatchSelectedReasons}
                      />
                      <div>{option}</div>
                    </label>
                  )
                })}
              </div>
              <div className="text-area-text-sm">
                <Input.TextArea
                  id="message"
                  name="message"
                  value={message}
                  onChange={(event: any) => setMessage(event.target.value)}
                  label="Anything else that we can improve on?"
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
            The unused amount for the remaining time of your billing cycle will be refunded as
            credits
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
    </>
  )
}

export default ExitSurveyModal
