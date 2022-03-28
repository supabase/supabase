import { FC, useEffect, useState } from 'react'
import { Transition } from '@headlessui/react'
import { Badge, Button, IconArrowLeft, IconHelpCircle, Toggle, Modal } from '@supabase/ui'

import { useStore } from 'hooks'
import { post, patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { getURL } from 'lib/helpers'
import Divider from 'components/ui/Divider'
import {
  PaymentSummaryPanel,
  ComputeSizeSelection,
  StripeSubscription,
  AddNewPaymentMethodModal,
} from '..'
import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { SubscriptionPreview } from '../Billing.types'
import UpdateSuccess from '../UpdateSuccess'
import { formatComputeSizes } from '../AddOns/AddOns.utils'
import { formSubscriptionUpdatePayload } from './ProUpgrade.utils'

// Do not allow compute size changes for af-south-1

interface Props {
  products: { tiers: any[]; addons: any[] }
  paymentMethods?: any[]
  currentSubscription: StripeSubscription
  isLoadingPaymentMethods: boolean
  onSelectBack: () => void
}

const ProUpgrade: FC<Props> = ({
  products,
  paymentMethods,
  currentSubscription,
  isLoadingPaymentMethods,
  onSelectBack,
}) => {
  const { ui } = useStore()

  const { addons } = products
  const computeSizes = formatComputeSizes(addons)

  const projectRef = ui.selectedProject?.ref
  const projectRegion = ui.selectedProject?.region ?? ''

  const currentComputeSize =
    computeSizes.find((option: any) => option.id === currentSubscription?.addons[0]?.prod_id) ||
    computeSizes.find((option: any) => option.metadata.supabase_prod_id === 'addon_instance_micro')

  const isManagingProSubscription =
    currentSubscription.tier.prod_id === STRIPE_PRODUCT_IDS.PRO ||
    currentSubscription.tier.prod_id === STRIPE_PRODUCT_IDS.PAYG

  const [isSpendCapEnabled, setIsSpendCapEnabled] = useState(
    // If project is currently free, default to enabling spend caps
    currentSubscription.tier.prod_id === STRIPE_PRODUCT_IDS.FREE ||
      // Otherwise, Pro plan implies spend caps enabled
      currentSubscription.tier.prod_id === STRIPE_PRODUCT_IDS.PRO
  )

  const [isRefreshingPreview, setIsRefreshingPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccessful, setIsSuccessful] = useState(false)
  const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState(false)
  const [showSpendCapHelperModal, setShowSpendCapHelperModal] = useState(false)

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>()
  const [selectedComputeSize, setSelectedComputeSize] = useState<any>(currentComputeSize)
  const [subscriptionPreview, setSubscriptionPreview] = useState<SubscriptionPreview>()

  const selectedTier = isSpendCapEnabled
    ? products?.tiers.find((tier: any) => tier.id === STRIPE_PRODUCT_IDS.PRO)
    : products?.tiers.find((tier: any) => tier.id === STRIPE_PRODUCT_IDS.PAYG)

  useEffect(() => {
    if (!isLoadingPaymentMethods && paymentMethods && paymentMethods.length > 0) {
      setSelectedPaymentMethod(paymentMethods[0].id)
    }
  }, [isLoadingPaymentMethods, paymentMethods])

  useEffect(() => {
    getSubscriptionPreview()
  }, [selectedComputeSize, isSpendCapEnabled])

  const onSelectComputeSizeOption = (option: any) => {
    setSelectedComputeSize(option)
  }

  const getSubscriptionPreview = async () => {
    if (!selectedTier) return

    const payload = formSubscriptionUpdatePayload(
      selectedTier,
      selectedComputeSize,
      selectedPaymentMethod,
      projectRegion
    )

    setIsRefreshingPreview(true)
    const preview = await post(`${API_URL}/projects/${projectRef}/subscription/preview`, payload)
    if (preview.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to fetch subscription preview: ${preview.error.message}`,
      })
    }
    setSubscriptionPreview(preview)
    setIsRefreshingPreview(false)
  }

  // Exact same thing as getSubscriptionpreview, can we make them into one
  const onConfirmPayment = async () => {
    const payload = formSubscriptionUpdatePayload(
      selectedTier,
      selectedComputeSize,
      selectedPaymentMethod,
      projectRegion
    )

    setIsSubmitting(true)
    const res = await patch(`${API_URL}/projects/${projectRef}/subscription`, payload)
    if (res?.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to update subscription: ${res?.error?.message}`,
      })
    } else {
      setIsSuccessful(true)
    }
    setIsSubmitting(false)
  }

  if (!isSubmitting && isSuccessful) {
    return (
      <UpdateSuccess
        projectRef={projectRef || ''}
        title="Your project has been updated!"
        message="Let us know if you have any feedback at sales@supabase.io."
      />
    )
  }

  return (
    <>
      <Transition
        show
        enter="transition ease-out duration-300"
        enterFrom="transform opacity-0 translate-x-10"
        enterTo="transform opacity-100 translate-x-0"
        className="w-full flex items-start justify-between"
      >
        <>
          <div className="w-3/5 mt-10">
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
                  {projectRegion !== 'af-south-1' && (
                    <>
                      <Divider light />
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg">Extend your project with add-ons</h4>
                        <Badge color="green">Optional</Badge>
                      </div>
                      <ComputeSizeSelection
                        computeSizes={computeSizes || []}
                        selectedComputeSize={selectedComputeSize}
                        onSelectOption={onSelectComputeSizeOption}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="w-2/5">
            <PaymentSummaryPanel
              isRefreshingPreview={isRefreshingPreview}
              subscriptionPreview={subscriptionPreview}
              currentPlan={currentSubscription.tier}
              selectedPlan={selectedTier}
              isSpendCapEnabled={isSpendCapEnabled}
              currentComputeSize={currentComputeSize}
              selectedComputeSize={selectedComputeSize}
              paymentMethods={paymentMethods}
              isLoadingPaymentMethods={isLoadingPaymentMethods}
              selectedPaymentMethod={selectedPaymentMethod}
              onSelectPaymentMethod={setSelectedPaymentMethod}
              onSelectAddNewPaymentMethod={() => {
                setShowAddPaymentMethodModal(true)
              }}
              onConfirmPayment={onConfirmPayment}
              isSubmitting={isSubmitting}
            />
          </div>
        </>
      </Transition>

      <AddNewPaymentMethodModal
        visible={showAddPaymentMethodModal}
        returnUrl={`${getURL()}/project/${projectRef}/settings/billing/update/pro`}
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
