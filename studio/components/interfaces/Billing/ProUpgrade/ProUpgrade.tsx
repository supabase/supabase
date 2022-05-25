import { FC, useEffect, useState } from 'react'
import { Transition } from '@headlessui/react'
import { useRouter } from 'next/router'
import { Button, IconHelpCircle, Toggle, Modal } from '@supabase/ui'

import { useFlag, useStore } from 'hooks'
import { post, patch } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
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
import BackButton from 'components/ui/BackButton'

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
  /**
   * Feature flags
   */
  const nativeBilling = useFlag('nativeBilling')

  const { app, ui } = useStore()
  const router = useRouter()

  const { addons } = products
  const computeSizes = formatComputeSizes(addons)

  const projectId = ui.selectedProject?.id ?? -1
  const projectRef = ui.selectedProject?.ref
  const projectRegion = ui.selectedProject?.region ?? ''

  const currentComputeSize =
    computeSizes.find((option: any) => option.id === currentSubscription?.addons[0]?.prod_id) ||
    computeSizes.find((option: any) => option.metadata.supabase_prod_id === 'addon_instance_micro')

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

  const isManagingProSubscription =
    currentSubscription.tier.prod_id === STRIPE_PRODUCT_IDS.PRO ||
    currentSubscription.tier.prod_id === STRIPE_PRODUCT_IDS.PAYG

  const isChangingComputeSize = currentComputeSize?.id !== selectedComputeSize.id

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
      if (isChangingComputeSize) {
        app.onProjectStatusUpdated(projectId, PROJECT_STATUS.RESTORING)
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
          <div className="2xl:min-w-5xl mx-auto mt-10">
            <div className="relative px-5 space-y-4">
              <BackButton onClick={() => onSelectBack()} />
              <div className="space-y-8">
                <h4 className="text-lg text-scale-900">Change your project's subscription</h4>
                <div
                  className="space-y-8 overflow-scroll pb-8"
                  style={{ height: 'calc(100vh - 9rem - 57px)' }}
                >
                  <div className="space-y-2">
                    {!isManagingProSubscription ? (
                      <>
                        <h3 className="text-xl">
                          Welcome to <span className="text-brand-900">Pro</span>
                        </h3>
                        <p className="text-base text-scale-1100">
                          Your new subscription will begin immediately after payment
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-3xl">
                          Managing your <span className="text-brand-900">Pro</span> plan
                        </h3>
                        <p className="text-base text-scale-1100">
                          Your billing cycle will reset after payment
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-16 border rounded px-6 py-4 bg-panel-body-light dark:bg-panel-body-dark drop-shadow-sm border-panel-border-light border-panel-border-dark">
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
                        If enabled, additional resources will not be charged on a per-usage basis
                      </p>
                    </div>
                    <Toggle
                      checked={isSpendCapEnabled}
                      onChange={() => setIsSpendCapEnabled(!isSpendCapEnabled)}
                    />
                  </div>
                  {nativeBilling && projectRegion !== 'af-south-1' && (
                    <>
                      <Divider light />
                      <ComputeSizeSelection
                        computeSizes={computeSizes || []}
                        currentComputeSize={currentComputeSize}
                        selectedComputeSize={selectedComputeSize}
                        onSelectOption={onSelectComputeSizeOption}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="w-[32rem]">
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
