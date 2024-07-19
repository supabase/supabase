import { includes, without } from 'lodash'
import { useReducer, useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useSendUpgradeFeedbackMutation } from 'data/feedback/upgrade-survey-send'
import type { OrgSubscription } from 'data/subscriptions/types'
import { Input, Modal } from 'ui'
import { generateUpgradeReasons } from '../helpers'

export interface UpgradeSurveyModalProps {
  visible: boolean
  originalPlan?: string
  subscription?: OrgSubscription
  onClose: (success?: boolean) => void
}

// Upgrade survey is from Free Plan to Pro/Team Plan and from Pro to Team Plan
const UpgradeSurveyModal = ({
  visible,
  originalPlan,
  subscription,
  onClose,
}: UpgradeSurveyModalProps) => {
  const { slug } = useParams()
  const [message, setMessage] = useState('')
  const [selectedReasons, dispatchSelectedReasons] = useReducer(reducer, [])

  const upgradeReasons = generateUpgradeReasons(originalPlan, subscription?.plan.id)

  const { mutate: sendUpgradeSurvey, isLoading: isSubmitting } = useSendUpgradeFeedbackMutation({
    onError: (error) => {
      toast.error(`Failed to submit survey: ${error.message}`)
    },
    onSuccess: () => {
      onClose(true)
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    },
  })

  function reducer(state: any, action: any) {
    if (includes(state, action.target.value)) {
      return without(state, action.target.value)
    } else {
      return [...state, action.target.value]
    }
  }

  const onSubmit = async () => {
    if (selectedReasons.length === 0) {
      return toast.error('Please select at least one reason for upgrading your subscription')
    }
    sendUpgradeSurvey({
      orgSlug: slug,
      prevPlan: originalPlan,
      currentPlan: subscription?.plan?.id,
      reasons: selectedReasons,
      message: message.trim() || undefined,
    })
  }

  return (
    <>
      <Modal
        alignFooter="right"
        size="xlarge"
        loading={isSubmitting}
        visible={visible}
        onCancel={onClose}
        onConfirm={onSubmit}
        cancelText="Skip"
        header="We're excited for your upgrade"
      >
        <Modal.Content className="space-y-4">
          <p className="text-sm text-foreground-light">
            What reasons motivated your decision to upgrade? Your feedback helps us improve Supabase
            as much as we can.
          </p>
          <div className="space-y-8 mt-6">
            <div className="flex flex-wrap gap-2" data-toggle="buttons">
              {upgradeReasons.map((option) => {
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
        </Modal.Content>
      </Modal>
    </>
  )
}

export default UpgradeSurveyModal
