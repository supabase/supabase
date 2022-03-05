import { FC, useEffect, useState } from 'react'
import { Transition } from '@headlessui/react'
import { Badge, Button, IconArrowLeft, IconHelpCircle, Toggle } from '@supabase/ui'

import Divider from 'components/ui/Divider'
import { PaymentSummaryPanel, ComputeSizeSelection, StripeSubscription } from '.'
import { BillingPlan } from './PlanSelection/Plans/Plans.types'
import { COMPUTE_SIZES } from './AddOns/AddOns.constant'

interface Props {
  visible: boolean
  currentPlan: StripeSubscription
  selectedPlan?: BillingPlan
  paymentMethods?: any[]
  onSelectBack: () => void

  isLoadingPaymentMethods: boolean
}

const ProUpgrade: FC<Props> = ({
  visible,
  currentPlan,
  selectedPlan,
  paymentMethods,
  onSelectBack,
  isLoadingPaymentMethods,
}) => {
  const [isOverageEnabled, setIsOverageEnabled] = useState(false)
  const [selectedComputeSize, setSelectedComputeSize] = useState<any>(COMPUTE_SIZES[0])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>()

  const onSelectComputeSizeOption = (option: any) => {
    setSelectedComputeSize(option)
  }

  useEffect(() => {
    if (!isLoadingPaymentMethods && paymentMethods && paymentMethods.length > 0) {
      // [TODO] Figure out how to get the DEFAULT payment method
      setSelectedPaymentMethod(paymentMethods[0])
    }
  }, [isLoadingPaymentMethods])

  return (
    <Transition
      show={visible}
      enter="transition ease-out duration-300"
      enterFrom="transform opacity-0 translate-x-10"
      enterTo="transform opacity-100 translate-x-0"
      className="w-full flex items-start justify-between"
    >
      {visible && (
        <>
          <div className="space-y-8 w-3/5">
            <div className="relative ml-64">
              <div className="absolute top-[2px] -left-24">
                <Button type="text" icon={<IconArrowLeft />} onClick={onSelectBack}>
                  Back
                </Button>
              </div>
              <div className="space-y-8">
                <h4 className="text-lg">Change your project's subscription</h4>
                <div
                  className="space-y-8 overflow-scroll pb-8 pr-20"
                  style={{ height: 'calc(100vh - 6.3rem - 49.5px)' }}
                >
                  <div className="space-y-1">
                    <h3 className="text-xl">
                      Welcome to <span className="text-green-1100">Pro</span>
                      <p className="text-sm text-scale-1100">
                        Your new subscription will begin immediately after payment
                      </p>
                    </h3>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <p>Enable overages</p>
                        <IconHelpCircle
                          size={16}
                          strokeWidth={1.5}
                          className="cursor-pointer opacity-50 hover:opacity-100 transition"
                          onClick={() => {}}
                        />
                      </div>
                      <p className="text-sm text-scale-1100">
                        Additional resources will be charged on a usage basis
                      </p>
                    </div>
                    <Toggle
                      checked={isOverageEnabled}
                      onChange={() => setIsOverageEnabled(!isOverageEnabled)}
                    />
                  </div>
                  <Divider light />
                  <div className="flex items-center space-x-2">
                    <h4 className="text-lg">Extend your project with add-ons</h4>
                    <Badge color="green">Optional</Badge>
                  </div>
                  <ComputeSizeSelection
                    selectedComputeSize={selectedComputeSize}
                    onSelectOption={onSelectComputeSizeOption}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="w-2/5 -mt-10">
            <PaymentSummaryPanel
              currentPlan={currentPlan}
              selectedPlan={selectedPlan}
              isOverageEnabled={isOverageEnabled}
              selectedComputeSize={selectedComputeSize}
              paymentMethods={paymentMethods}
              isLoadingPaymentMethods={isLoadingPaymentMethods}
              selectedPaymentMethod={selectedPaymentMethod}
              onSelectPaymentMethod={setSelectedPaymentMethod}
            />
          </div>
        </>
      )}
    </Transition>
  )
}

export default ProUpgrade
