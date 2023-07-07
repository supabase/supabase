import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useQueryClient } from '@tanstack/react-query'
import { includes, without } from 'lodash'
import { useRouter } from 'next/router'
import { useReducer, useRef, useState } from 'react'

import { useParams } from 'common'
import { useFlag, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { Button, Input, Modal } from 'ui'
import { CANCELLATION_REASONS } from '../BillingSettings.constants'
import ProjectUpdateDisabledTooltip from '../../BillingSettings/ProjectUpdateDisabledTooltip'
import { useOrgSubscriptionUpdateMutation } from 'data/subscriptions/org-subscription-update-mutation'

export interface ExitSurveyModalProps {
  visible: boolean
  onClose: (success?: boolean) => void
}

// [Joshen] For context - Exit survey is only when going to free plan from a paid plan
// [Joshen TODO] Remove all contexts of projects - i'm presuming we still want the exit survey
// [Joshen TODO] Double check if we should have a confirmation here on the restarting of projects once more (i think so)

const ExitSurveyModal = ({ visible, onClose }: ExitSurveyModalProps) => {
  const { ui } = useStore()
  const router = useRouter()
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const captchaRef = useRef<HCaptcha>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [selectedReasons, dispatchSelectedReasons] = useReducer(reducer, [])

  const subscriptionUpdateDisabled = useFlag('disableProjectCreationAndUpdate')
  const { mutateAsync: updateOrgSubscription } = useOrgSubscriptionUpdateMutation()

  const hasComputeInstance = false

  function reducer(state: any, action: any) {
    if (includes(state, action.target.value)) {
      return without(state, action.target.value)
    } else {
      return [...state, action.target.value]
    }
  }

  const resetCaptcha = () => {
    setCaptchaToken(null)
    captchaRef.current?.resetCaptcha()
  }

  const onSubmit = async () => {
    if (selectedReasons.length === 0) {
      return ui.setNotification({
        category: 'error',
        message: 'Please select at least one reason for canceling your subscription',
      })
    }

    setIsSubmitting(true)
    let token = captchaToken

    try {
      if (!token) {
        const captchaResponse = await captchaRef.current?.execute({ async: true })
        token = captchaResponse?.response ?? null
        await downgradeOrganization()
      }
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to downgrade project: ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const downgradeOrganization = async (values?: any) => {
    // Update the subscription first, followed by posting the exit survey if successful
    // If compute instance is present within the existing subscription, then a restart will be triggered
    if (!slug) return console.error('Slug is required')

    try {
      await updateOrgSubscription({ slug, tier: 'tier_free' })
      resetCaptcha()
    } catch (error: any) {
      return ui.setNotification({
        error,
        category: 'error',
        message: `Failed to downgrade subscription: ${error.message}`,
      })
    }

    try {
      // [Joshen TODO] Update to accept org slug once endpoint is updated
      const feedbackRes = await post(`${API_URL}/feedback/downgrade`, {
        orgSlug: slug,
        reasons: selectedReasons.reduce((a, b) => `${a}- ${b}\n`, ''),
        additionalFeedback: message,
        exitAction: 'downgrade',
      })
      if (feedbackRes.error) throw feedbackRes.error
    } catch (error: any) {
      return ui.setNotification({
        error,
        category: 'info',
        message: `Failed to submit exit survey: ${error.message}`,
      })
    } finally {
      ui.setNotification({
        category: 'success',
        duration: hasComputeInstance ? 8000 : 4000,
        message: hasComputeInstance
          ? 'Your organization has been downgraded and your projects are currently restarting to update their compute instances'
          : 'Successfully downgraded organization to the free plan',
      })
      // [Joshen TODO] Think about how to handle this
      // if (hasComputeInstance) {
      //   setProjectStatus(queryClient, projectRef, PROJECT_STATUS.RESTORING)
      //   router.push(`/project/${projectRef}`)
      // }
      onClose(true)
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      <div className="self-center">
        <HCaptcha
          ref={captchaRef}
          sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
          size="invisible"
          onVerify={(token) => {
            setCaptchaToken(token)
            if (document !== undefined) document.body.classList.remove('!pointer-events-auto')
          }}
          onExpire={() => setCaptchaToken(null)}
          onOpen={() => {
            // [Joshen] This is to ensure that hCaptcha popup remains clickable
            if (document !== undefined) document.body.classList.add('!pointer-events-auto')
          }}
          onClose={() => {
            if (document !== undefined) document.body.classList.remove('!pointer-events-auto')
          }}
        />
      </div>

      <Modal
        hideFooter
        size="xlarge"
        visible={visible}
        onCancel={onClose}
        header="We're sad that you're leaving"
      >
        <Modal.Content>
          <div className="py-6">
            <p className="text-sm text-scale-1100">
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
                          ? ` bg-scale-1200 text-scale-100 opacity-100 hover:bg-opacity-75`
                          : ` bg-scale-700 text-scale-1200 opacity-25 hover:opacity-50`
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
          </div>
        </Modal.Content>

        <div className="flex items-center justify-between border-t px-4 py-4">
          <p className="text-xs text-scale-900">
            The unused amount for the remaining of your billing cycle will be refunded as credits
          </p>
          <div className="flex items-center space-x-2">
            <Button type="default" onClick={() => onClose()}>
              Cancel
            </Button>
            <ProjectUpdateDisabledTooltip projectUpdateDisabled={subscriptionUpdateDisabled}>
              <Button
                type="danger"
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
