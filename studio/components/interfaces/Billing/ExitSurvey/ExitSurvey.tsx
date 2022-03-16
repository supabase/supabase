import { FC, useReducer } from 'react'
import { includes, without } from 'lodash'
import { Transition } from '@headlessui/react'
import { Button, Form, Input, IconArrowLeft } from '@supabase/ui'

import { useStore } from 'hooks'
import { post, patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { CANCELLATION_REASONS } from '../Billing.constants'
import { generateFeedbackMessage } from './ExitSurvey.utils'

interface Props {
  onSelectBack: () => void
}

const ExitSurvey: FC<Props> = ({ onSelectBack }) => {
  const { ui } = useStore()
  const projectRef = ui.selectedProject?.ref

  const initialValues = { message: '' }
  const [selectedReasons, dispatchSelectedReasons] = useReducer(reducer, [])

  function reducer(state: any, action: any) {
    if (includes(state, action.target.value)) {
      return without(state, action.target.value)
    } else {
      return [...state, action.target.value]
    }
  }

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      setSubmitting(true)
      if (selectedReasons.length === 0) {
        return ui.setNotification({
          category: 'error',
          message: 'Please select at least one reason for cancelling your subscription',
        })
      }

      // Submit feedback to Freshdesk (Disabled for local tetsing)
      // await post(`${API_URL}/feedback/send`, {
      //   projectRef,
      //   subject: 'Subscription cancellation - Exit survey',
      //   tags: ['dashboard-exitsurvey'],
      //   category: 'Billing',
      //   message: generateFeedbackMessage(selectedReasons, values.message),
      // })

      // Trigger subscription downgrade
      // [TODO] please use from API please
      const tier = 'price_1KCawmJDPojXS6LNahIn31Mr'
      const addons: string[] = []
      const proration_date = Math.floor(Date.now() / 1000)
      const res = await patch(`${API_URL}/projects/${projectRef}/subscription`, {
        tier,
        addons,
        proration_date,
      })

      if (res?.error) {
        ui.setNotification({
          category: 'error',
          message: `Failed to cancel subscription: ${res?.error?.message}`,
          error: res.error,
        })
      } else {
        console.log('Succesfully updated subscription')
      }
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: `Failed to cancel subscription: ${error}` })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Transition
      show
      appear
      enter="transition ease-out duration-300"
      enterFrom="transform opacity-0 translate-x-10"
      enterTo="transform opacity-100 translate-x-0"
    >
      <div className="space-y-8 w-4/5">
        <div className="relative">
          <div className="absolute top-[2px] -left-24">
            <Button type="text" icon={<IconArrowLeft />} onClick={onSelectBack}>
              Back
            </Button>
          </div>
          <div className="space-y-1">
            <h4 className="text-lg">We're sad that you're leaving.</h4>
            <p className="text-scale-1100">
              We always strive to improve Supabase as much as we can. Please let us know the reasons
              you are cancelling your subscription so that we can improve in the future.
            </p>
          </div>
          <Form validateOnBlur initialValues={initialValues} onSubmit={onSubmit}>
            {({ isSubmitting }: { isSubmitting: boolean }) => (
              <div className="space-y-8 py-8">
                <div className="flex flex-wrap gap-2" data-toggle="buttons">
                  {CANCELLATION_REASONS.map((option) => {
                    const active = selectedReasons.find((x) => x === option)
                    return (
                      <label
                        key={option}
                        className={`
                              text-center rounded-md py-1 pl-2 pr-3 shadow-sm 
                              transition-all flex items-center space-x-2
                              duration-100 cursor-pointer text-sm
                              ${
                                active
                                  ? ` opacity-100 bg-scale-1200 text-scale-100 hover:bg-opacity-75`
                                  : ` bg-scale-700 opacity-25 hover:opacity-50 text-scale-1200`
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
                  <Button htmlType="button" type="default">
                    Cancel
                  </Button>
                  <Button htmlType="submit" type="danger" loading={isSubmitting}>
                    Confirm downgrade
                  </Button>
                  <p className="text-xs text-scale-900">
                    The unused amount for the remaining of your billing cycle will be refunded as
                    credits
                  </p>
                </div>
              </div>
            )}
          </Form>
        </div>
      </div>
    </Transition>
  )
}

export default ExitSurvey
