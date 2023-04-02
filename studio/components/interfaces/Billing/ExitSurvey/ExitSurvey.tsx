import { FC, useReducer, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { includes, without } from 'lodash'
import { Transition } from '@headlessui/react'
import { Button, Form, Input, Modal, IconArrowLeft, Alert } from 'ui'

import { useStore } from 'hooks'
import { post, patch } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { CANCELLATION_REASONS } from '../Billing.constants'
import { UpdateSuccess } from '../'
import { SubscriptionPreview } from '../Billing.types'
import { StripeSubscription } from 'components/interfaces/Billing'
import HCaptcha from '@hcaptcha/react-hcaptcha'

interface Props {
  freeTier: any
  subscription?: StripeSubscription
  onSelectBack: () => void
}

const ExitSurvey: FC<Props> = ({ freeTier, subscription, onSelectBack }) => {
  const router = useRouter()
  const { app, ui } = useStore()
  const projectId = ui.selectedProject?.id ?? -1
  const projectRef = ui.selectedProject?.ref

  const captchaRef = useRef<HCaptcha>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const formRef = useRef<any>()

  const initialValues = { message: '' }
  const [message, setMessage] = useState('')
  const [selectedReasons, dispatchSelectedReasons] = useReducer(reducer, [])

  // Tracking submitting state separately outside of form component cause of
  // the additional dynamic confirmation modal that we're doing
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittingDowngradeModal, setIsSubmittingDowngradeModal] = useState(false)

  const [isSuccessful, setIsSuccessful] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [subscriptionPreview, setSubscriptionPreview] = useState<SubscriptionPreview>()

  // Anything above a micro instance size will involve a change in compute size
  // as downgrading back to free will bring the project back to micro
  const currentComputeSize = subscription?.addons.find((option) =>
    option.supabase_prod_id.includes('addon_instance')
  )
  const returnedAmount = (subscriptionPreview?.returned_credits_for_unused_time ?? 0) / 100
  const billingDate = new Date((subscriptionPreview?.bill_on ?? 0) * 1000)

  useEffect(() => {
    if (freeTier) {
      getSubscriptionPreview()
    }
  }, [freeTier])

  function reducer(state: any, action: any) {
    if (includes(state, action.target.value)) {
      return without(state, action.target.value)
    } else {
      return [...state, action.target.value]
    }
  }

  const getDowngradeRefundMessage = () => {
    return `A total of $${returnedAmount} will be refunded as credits on ${billingDate.toLocaleDateString(
      'en-US',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    )} to your balance for unused time on your resources. Do let us know if you have any other feedback at sales@supabase.io.`
  }

  const getSubscriptionPreview = async () => {
    const proration_date = Math.floor(Date.now() / 1000)
    const preview = await post(`${API_URL}/projects/${projectRef}/subscription/preview`, {
      tier: freeTier.prices[0].id,
      addons: [],
      proration_date,
    })
    setSubscriptionPreview(preview)
  }

  const onSubmit = async (values: any) => {
    if (selectedReasons.length === 0) {
      return ui.setNotification({
        category: 'error',
        message: 'Please select at least one reason for cancelling your subscription',
      })
    }

    setIsSubmitting(true)
    let token = captchaToken

    try {
      if (!token) {
        const captchaResponse = await captchaRef.current?.execute({ async: true })
        token = captchaResponse?.response ?? null
      }
    } catch (error) {
      setIsSubmitting(false)
      return
    }

    if (currentComputeSize !== undefined) {
      setMessage(values.message)
      return setShowConfirmModal(true)
    } else {
      downgradeProject(values)
    }
  }

  const resetCaptcha = () => {
    setCaptchaToken(null)
    captchaRef.current?.resetCaptcha()
  }

  const downgradeProject = async (values?: any) => {
    const downgradeMessage = values?.message ?? message

    try {
      setIsSubmitting(true)
      setIsSubmittingDowngradeModal(true)

      // Trigger subscription downgrade
      const tier = freeTier.prices[0].id
      const addons: string[] = []
      const proration_date = Math.floor(Date.now() / 1000)
      const res = await patch(`${API_URL}/projects/${projectRef}/subscription`, {
        tier,
        addons,
        proration_date,
      })

      resetCaptcha()

      if (res?.error) {
        return ui.setNotification({
          category: 'error',
          message: `Failed to cancel subscription: ${res?.error?.message}`,
          error: res.error,
        })
      } else {
        if (currentComputeSize !== undefined) {
          app.onProjectStatusUpdated(projectId, PROJECT_STATUS.RESTORING)
          ui.setNotification({
            category: 'info',
            message: getDowngradeRefundMessage(),
            duration: 8000,
          })
          ui.setNotification({
            category: 'success',
            message:
              'Your project has been updated and is currently restarting to update its instance size',
            duration: 8000,
          })
          router.push(`/project/${projectRef}`)
        } else {
          setIsSuccessful(true)
        }
      }
      const feedbackRes = await post(`${API_URL}/feedback/downgrade`, {
        projectRef,
        reasons: selectedReasons.reduce((a, b) => `${a}- ${b}\n`, ''),
        additionalFeedback: downgradeMessage,
        exitAction: 'downgrade',
      })
      if (feedbackRes.error) throw feedbackRes.error
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to cancel subscription: ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
      setIsSubmittingDowngradeModal(false)
    }
  }

  if (isSuccessful) {
    return (
      <UpdateSuccess
        projectRef={projectRef || ''}
        title="Your project has been updated"
        message={getDowngradeRefundMessage()}
      />
    )
  }

  return (
    <>
      <Transition
        show
        appear
        enter="transition ease-out duration-300"
        enterFrom="transform opacity-0 translate-x-10"
        enterTo="transform opacity-100 translate-x-0"
      >
        <div className="w-full xl:w-4/5 space-y-8">
          <div ref={formRef} className="relative">
            <div className="absolute top-[2px] -left-24">
              <Button type="text" icon={<IconArrowLeft />} onClick={onSelectBack}>
                Back
              </Button>
            </div>
            <div className="space-y-1">
              <h4 className="text-lg">We're sad that you're leaving.</h4>
              <p className="text-scale-1100">
                We always strive to improve Supabase as much as we can. Please let us know the
                reasons you are cancelling your subscription so that we can improve in the future.
              </p>
            </div>
            <Form validateOnBlur initialValues={initialValues} onSubmit={onSubmit}>
              {() => (
                <div className="space-y-8 py-8">
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
                  <Input.TextArea
                    id="message"
                    name="message"
                    label="Anything else that we can improve on?"
                  />
                  <div className="flex items-center space-x-2">
                    <Button
                      htmlType="button"
                      type="default"
                      onClick={() => router.push(`/project/${projectRef}/settings/billing/update`)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="danger"
                      htmlType="submit"
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      Confirm downgrade
                    </Button>
                    <p className="text-xs text-scale-900">
                      The unused amount for the remaining of your billing cycle will be refunded as
                      credits
                    </p>
                  </div>
                  <div className="self-center">
                    <HCaptcha
                      ref={captchaRef}
                      sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
                      size="invisible"
                      onVerify={(token) => {
                        setCaptchaToken(token)
                      }}
                      onExpire={() => {
                        setCaptchaToken(null)
                      }}
                    />
                  </div>
                </div>
              )}
            </Form>
          </div>
        </div>
      </Transition>
      <Modal
        hideFooter
        visible={showConfirmModal}
        size="large"
        header="Downgrading project to free"
        onCancel={() => {
          setShowConfirmModal(false)
          setIsSubmitting(false)
        }}
      >
        <div className="space-y-4 py-4">
          <Modal.Content>
            <Alert
              withIcon
              variant="warning"
              title="Your project will need to be restarted for changes to take place"
            >
              Your project is currently using a{' '}
              {(currentComputeSize?.name ?? '').toLocaleLowerCase()} and will be downgraded to a
              micro add-on. Upon confirmation, your project will be restarted for changes to take
              place. This will take up to 2 minutes during which your project will be unavailable.
            </Alert>
          </Modal.Content>
          <Modal.Content>
            <p className="text-sm text-scale-1200">Would you like to update your project now?</p>
          </Modal.Content>
          <Modal.Separator />
          <Modal.Content>
            <div className="flex items-center gap-2">
              <Button
                block
                type="default"
                onClick={() => {
                  setShowConfirmModal(false)
                  setIsSubmitting(false)
                }}
              >
                Cancel
              </Button>
              <Button
                block
                htmlType="submit"
                loading={isSubmittingDowngradeModal}
                disabled={isSubmittingDowngradeModal}
                onClick={() => downgradeProject()}
              >
                Confirm
              </Button>
            </div>
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
}

export default ExitSurvey
