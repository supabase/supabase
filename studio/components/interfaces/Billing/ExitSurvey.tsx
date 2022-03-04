import { FC, useReducer } from 'react'
import { includes, without } from 'lodash'
import { Transition } from '@headlessui/react'
import { Button, Form, Input, IconArrowLeft } from '@supabase/ui'

import { timeout } from 'lib/helpers'
import { CANCELLATION_REASONS } from './Billing.constants'

interface Props {
  visible: boolean
  onSelectBack: () => void
}

const ExitSurvey: FC<Props> = ({ visible, onSelectBack }) => {
  const initialValues = { message: '' }
  const [selectedCancellationReasons, dispatchSelectedCancellationReasons] = useReducer(reducer, [])

  function reducer(state: any, action: any) {
    if (includes(state, action.target.value)) {
      return without(state, action.target.value)
    } else {
      return [...state, action.target.value]
    }
  }

  const onValidate = (values: any) => {
    console.log('onValidate', values, selectedCancellationReasons)
  }

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true)
    await timeout(1000)
    console.log('onSubmit', values, selectedCancellationReasons)
    setSubmitting(false)
  }

  return (
    <Transition
      show={visible}
      enter="transition ease-out duration-300"
      enterFrom="transform opacity-0 translate-x-10"
      enterTo="transform opacity-100 translate-x-0"
    >
      {visible && (
        <div className="space-y-8 w-4/5">
          <div className="relative">
            <div className="absolute top-[2px] -left-24">
              <Button type="text" icon={<IconArrowLeft />} onClick={onSelectBack}>
                Back
              </Button>
            </div>
            <div className="space-y-1">
              <h4 className="text-xl">We're sad that you're leaving.</h4>
              <p className="text-scale-1100">
                We always strive to improve Supabase as much as we can. Please let us know the
                reasons you are cancelling your subscription so that we can improve in the future.
              </p>
            </div>
            <Form
              validateOnBlur
              initialValues={initialValues}
              validate={onValidate}
              onSubmit={onSubmit}
            >
              {({ isSubmitting }: { isSubmitting: boolean }) => (
                <div className="space-y-8 py-8">
                  <div className="flex flex-wrap gap-2" data-toggle="buttons">
                    {CANCELLATION_REASONS.map((option) => {
                      const active = selectedCancellationReasons.find((x) => x === option)
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
                            onClick={dispatchSelectedCancellationReasons}
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
      )}
    </Transition>
  )
}

export default ExitSurvey
