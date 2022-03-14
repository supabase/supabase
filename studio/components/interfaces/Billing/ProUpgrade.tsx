import { FC, useEffect, useState } from 'react'
import { Transition } from '@headlessui/react'
import { useRouter } from 'next/router'
import { Badge, Button, IconArrowLeft, IconHelpCircle, Toggle, Modal } from '@supabase/ui'

import { useStore } from 'hooks'
import { getURL, timeout } from 'lib/helpers'
import { post, patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import Divider from 'components/ui/Divider'
import {
  PaymentSummaryPanel,
  ComputeSizeSelection,
  StripeSubscription,
  AddNewPaymentMethodModal,
} from '.'
import { BillingPlan } from './PlanSelection/Plans/Plans.types'
import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { SubscriptionPreview } from './Billing.types'

interface Props {
  visible: boolean
  products: { tiers: any[]; addons: any[] }

  currentSubscription: StripeSubscription
  selectedPlan?: BillingPlan
  paymentMethods?: any[]
  isLoadingPaymentMethods: boolean
  onSelectBack: () => void
}

const ProUpgrade: FC<Props> = ({
  visible,
  products,
  currentSubscription,
  selectedPlan,
  paymentMethods,
  isLoadingPaymentMethods,
  onSelectBack,
}) => {
  const { ui } = useStore()
  const router = useRouter()

  const { tiers, addons } = products
  const projectRef = ui.selectedProject?.ref

  const currentComputeSize =
    addons.find((option: any) => option.id === currentSubscription?.addons[0]?.prod_id) ||
    addons.find((option: any) => option.name.includes('[Small]'))

  const isManagingProSubscription =
    currentSubscription.tier.prod_id === STRIPE_PRODUCT_IDS.PRO ||
    currentSubscription.tier.prod_id === STRIPE_PRODUCT_IDS.PAYG

  const [isSpendCapEnabled, setIsSpendCapEnabled] = useState(
    currentSubscription.tier.prod_id === STRIPE_PRODUCT_IDS.PRO
  )

  const [isRefreshingPreview, setIsRefreshingPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccessful, setIsSuccessful] = useState(false)
  const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState(false)
  const [showSpendCapHelperModal, setShowSpendCapHelperModal] = useState(false)

  // Ignore for first iteration, just use default payment method
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>()
  const [selectedComputeSize, setSelectedComputeSize] = useState<any>(currentComputeSize)
  const [subscriptionPreview, setSubscriptionPreview] = useState<SubscriptionPreview>()

  useEffect(() => {
    if (!isLoadingPaymentMethods && paymentMethods && paymentMethods.length > 0) {
      // [TODO] Figure out how to get the DEFAULT payment method
      setSelectedPaymentMethod(paymentMethods[0])
    }
  }, [isLoadingPaymentMethods, paymentMethods])

  useEffect(() => {
    if (selectedPlan !== undefined && selectedPlan.id !== STRIPE_PRODUCT_IDS.FREE) {
      getSubscriptionPreview()
    }
  }, [selectedPlan, selectedComputeSize, isSpendCapEnabled])

  useEffect(() => {
    if (selectedPlan?.id === STRIPE_PRODUCT_IDS.PRO) {
      setIsSpendCapEnabled(true)
    }
  }, [selectedPlan])

  const onSelectComputeSizeOption = (option: any) => {
    setSelectedComputeSize(option)
  }

  const redirectToPortal = async (path: any) => {
    try {
      const stripeCustomerId = ui.selectedOrganization?.stripe_customer_id
      if (!stripeCustomerId) throw new Error("Unable to get organization's Stripe ID")

      let { billingPortal } = await post(`${API_URL}/stripe/billing`, {
        stripe_customer_id: stripeCustomerId,
        returnTo: `${getURL()}${router.asPath}`,
      })
      window.location.replace(billingPortal + (path ? path : null))
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: `Failed to redirect: ${error.message}` })
    }
  }

  const getSubscriptionPreview = async () => {
    const selectedTier = !isSpendCapEnabled
      ? tiers.find((tier: any) => tier.id === STRIPE_PRODUCT_IDS.PAYG)
      : tiers.find((tier: any) => tier.id === selectedPlan?.id)

    // [TODO] Small currently has no stripe product attached, so FE has a hardcoded ID just for that product
    // [UPDATE] it now has, just verify if attaching a Small will mess things up
    const addons = selectedComputeSize.name.includes('[Small]')
      ? []
      : [selectedComputeSize.prices[0].id]
    const proration_date = Math.floor(Date.now() / 1000)

    if (!selectedTier) return

    setIsRefreshingPreview(true)
    const preview = await post(`${API_URL}/projects/${projectRef}/subscription/preview`, {
      tier: selectedTier.prices[0].id,
      addons,
      proration_date,
    })
    if (preview.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to fetch subscription preview: ${preview.error.message}`,
      })
    }
    setSubscriptionPreview(preview)
    setIsRefreshingPreview(false)
    console.log('Preview retrieved', preview)
  }

  // Exact same thing as getSubscriptionpreview, can we make them into one
  const onConfirmPayment = async () => {
    const selectedTier = !isSpendCapEnabled
      ? tiers.find((tier: any) => tier.id === STRIPE_PRODUCT_IDS.PAYG)
      : tiers.find((tier: any) => tier.id === selectedPlan?.id)

    // [TODO] Small currently has no stripe product attached, so FE has a hardcoded ID just for that product
    // [UPDATE] it now has, just verify if attaching a Small will mess things up
    const addons = selectedComputeSize.name.includes('[Small]')
      ? []
      : [selectedComputeSize.prices[0].id]
    const proration_date = Math.floor(Date.now() / 1000)

    setIsSubmitting(true)
    await timeout(1000)
    const res = await patch(`${API_URL}/projects/${projectRef}/subscription`, {
      tier: selectedTier.prices[0].id,
      addons,
      proration_date,
    })
    if (res?.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to update subscription: ${res?.error?.message}`,
      })
    } else {
      setIsSuccessful(true)
      ui.setNotification({
        category: 'success',
        message: 'Done',
      })
      console.log('Succesfully updated subscription')
    }
    setIsSubmitting(false)
  }

  if (!isSubmitting && isSuccessful) {
    return <div className="">Some success state here to be done</div>
  }

  return (
    <>
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
                    {!isManagingProSubscription ? (
                      <div className="space-y-1">
                        <h3 className="text-xl">
                          Welcome to <span className="text-green-1100">Pro</span>
                          <p className="text-sm text-scale-1100">
                            Your new subscription will begin immediately after payment
                          </p>
                        </h3>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <h3 className="text-xl">
                          Managing your <span className="text-green-1100">Pro</span> plan
                          <p className="text-sm text-scale-1100">
                            Your billing cycle will reset after payment
                          </p>
                        </h3>
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <p>Enable spend cap</p>
                          <IconHelpCircle
                            size={16}
                            strokeWidth={1.5}
                            className="cursor-pointer opacity-50 hover:opacity-100 transition"
                            onClick={() => setShowSpendCapHelperModal(true)}
                          />
                        </div>
                        <p className="text-sm text-scale-1100">
                          If disabled, additional resources will be charged on a per-usage basis
                        </p>
                      </div>
                      <Toggle
                        checked={isSpendCapEnabled}
                        onChange={() => setIsSpendCapEnabled(!isSpendCapEnabled)}
                      />
                    </div>
                    <Divider light />
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg">Extend your project with add-ons</h4>
                      <Badge color="green">Optional</Badge>
                    </div>
                    <ComputeSizeSelection
                      computeSizes={addons || []}
                      selectedComputeSize={selectedComputeSize}
                      onSelectOption={onSelectComputeSizeOption}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="w-2/5 -mt-10">
              <PaymentSummaryPanel
                isRefreshingPreview={isRefreshingPreview}
                subscriptionPreview={subscriptionPreview}
                currentPlan={currentSubscription.tier}
                selectedPlan={selectedPlan}
                isSpendCapEnabled={isSpendCapEnabled}
                currentComputeSize={currentComputeSize}
                selectedComputeSize={selectedComputeSize}
                paymentMethods={paymentMethods}
                isLoadingPaymentMethods={isLoadingPaymentMethods}
                selectedPaymentMethod={selectedPaymentMethod}
                onSelectPaymentMethod={setSelectedPaymentMethod}
                onSelectAddNewPaymentMethod={() => {
                  // [TODO] For now, use stripe's web portal to add payment method
                  redirectToPortal('/payment-methods')
                  // setShowAddPaymentMethodModal(true)
                }}
                onConfirmPayment={onConfirmPayment}
                isSubmitting={isSubmitting}
              />
            </div>
          </>
        )}
      </Transition>

      <AddNewPaymentMethodModal
        visible={showAddPaymentMethodModal}
        onCancel={() => setShowAddPaymentMethodModal(false)}
      />

      {/* Spend caps helper modal */}
      <Modal
        hideFooter
        visible={showSpendCapHelperModal}
        size="large"
        header="Enabling spend cap"
        onCancel={() => setShowSpendCapHelperModal(false)}
      >
        <div className="py-4 space-y-4">
          <Modal.Content>
            {/* [TODO] revise wording for "enabling spend caps" instead of overages */}
            <div className="space-y-4">
              <p className="text-sm">
                A spend cap allows you to restrict your project's resource usage within the limits
                of the Pro tier. Disabling the spend cap will then remove those limits and any
                additional resources consumed beyond the Pro tier limits will be charged on a
                per-usage basis
              </p>
              <p className="text-sm">
                The table below shows an overview of which resources are chargeable, and how they
                are charged:
              </p>
              {/* Maybe instead of a table, show something more interactive like a spend cap playground */}
              {/* Maybe ideate this in Figma first but this is good enough for now */}
              <div className="border border-scale-600 bg-scale-500 rounded">
                <div className="flex items-center px-4 pt-2 pb-1">
                  <p className="w-[50%] text-sm text-scale-1100">Item</p>
                  <p className="w-[25%] text-sm text-scale-1100">Limit</p>
                  <p className="w-[25%] text-sm text-scale-1100">Rate</p>
                </div>
                <div className="py-1">
                  <div className="flex items-center px-4 py-1">
                    <p className="w-[50%] text-sm">Database space</p>
                    <p className="w-[25%] text-sm">8GB</p>
                    <p className="w-[25%] text-sm">$0.125/GB</p>
                  </div>
                  <div className="flex items-center px-4 py-1">
                    <p className="w-[50%] text-sm">Data transfer</p>
                    <p className="w-[25%] text-sm">50GB</p>
                    <p className="w-[25%] text-sm">$0.09/GB</p>
                  </div>
                </div>
                <div className="py-1">
                  <div className="flex items-center px-4 py-1">
                    <p className="w-[50%] text-sm">Auth Monthly Active Users</p>
                    <p className="w-[25%] text-sm">10,000</p>
                    <p className="w-[25%] text-sm">$1.50/100 users</p>
                  </div>
                </div>
                <div className="py-1">
                  <div className="flex items-center px-4 py-1">
                    <p className="w-[50%] text-sm">Storage size</p>
                    <p className="w-[25%] text-sm">100GB</p>
                    <p className="w-[25%] text-sm">$0.021/GB</p>
                  </div>
                  <div className="flex items-center px-4 py-1">
                    <p className="w-[50%] text-sm">Data Transfer</p>
                    <p className="w-[25%] text-sm">50GB</p>
                    <p className="w-[25%] text-sm">$0.09/GB</p>
                  </div>
                </div>
              </div>
            </div>
          </Modal.Content>
          <Modal.Seperator />
          <Modal.Content>
            <div className="flex items-center gap-2">
              <Button block type="primary" onClick={() => setShowSpendCapHelperModal(false)}>
                Understood
              </Button>
            </div>
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
}

export default ProUpgrade
