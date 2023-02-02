import { FC, useEffect, useRef, useState } from 'react'
import { Transition } from '@headlessui/react'
import { useRouter } from 'next/router'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, IconHelpCircle, Toggle, Modal } from 'ui'

import { useStore } from 'hooks'
import { post, patch } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { getURL } from 'lib/helpers'
import Divider from 'components/ui/Divider'
import {
  PaymentSummaryPanel,
  ComputeSizeSelection,
  PITRDurationSelection,
  CustomDomainSelection,
  StripeSubscription,
  AddNewPaymentMethodModal,
} from './'
import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import UpdateSuccess from './UpdateSuccess'
import { PaymentMethod, SubscriptionPreview } from './Billing.types'
import { formSubscriptionUpdatePayload, getCurrentAddons } from './Billing.utils'
import { SubscriptionAddon } from './AddOns/AddOns.types'
import {
  formatComputeSizes,
  formatCustomDomainOptions,
  formatPITROptions,
} from './AddOns/AddOns.utils'
import BackButton from 'components/ui/BackButton'
import SupportPlan from './AddOns/SupportPlan'
import HCaptcha from '@hcaptcha/react-hcaptcha'

// Do not allow compute size changes for af-south-1

interface Props {
  products: { tiers: any[]; addons: SubscriptionAddon[] }
  paymentMethods?: PaymentMethod[]
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
  const { app, ui } = useStore()
  const router = useRouter()

  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)

  const { addons } = products
  const computeSizes = formatComputeSizes(addons)
  const pitrDurationOptions = formatPITROptions(addons)
  const customDomainOptions = formatCustomDomainOptions(addons)
  const currentAddons = getCurrentAddons(currentSubscription, addons)

  const projectId = ui.selectedProject?.id ?? -1
  const projectRef = ui.selectedProject?.ref
  const projectRegion = ui.selectedProject?.region ?? ''

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

  // [Joshen TODO] Ideally we just have a state to hold all the add ons selection, rather than individual
  // Even better if we can just use the <Form> component to handle all of these. Mainly to reduce the amount
  // of unnecessary state management on this complex page.
  const [selectedComputeSize, setSelectedComputeSize] = useState<SubscriptionAddon>(
    currentAddons.computeSize
  )
  const [selectedPITRDuration, setSelectedPITRDuration] = useState<SubscriptionAddon>(
    currentAddons.pitrDuration
  )
  const [selectedCustomDomainOption, setSelectedCustomDomainOption] = useState<SubscriptionAddon>(
    currentAddons.customDomains
  )

  // [Joshen TODO] Future - We may need to also include any add ons outside of
  // compute size, pitr, custom domain and support plan, although we dont have any now
  const nonChangeableAddons = [currentAddons.supportPlan].filter(
    (x) => x !== undefined
  ) as SubscriptionAddon[]

  // [Joshen] Scaffolded here
  const selectedAddons = {
    computeSize: selectedComputeSize,
    pitrDuration: selectedPITRDuration,
    customDomains: selectedCustomDomainOption,
  }

  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('')
  const [subscriptionPreview, setSubscriptionPreview] = useState<SubscriptionPreview>()

  const selectedTier = isSpendCapEnabled
    ? products?.tiers.find((tier: any) => tier.id === STRIPE_PRODUCT_IDS.PRO)
    : products?.tiers.find((tier: any) => tier.id === STRIPE_PRODUCT_IDS.PAYG)

  const isManagingProSubscription =
    currentSubscription.tier.prod_id === STRIPE_PRODUCT_IDS.PRO ||
    currentSubscription.tier.prod_id === STRIPE_PRODUCT_IDS.PAYG

  const isChangingComputeSize = currentAddons.computeSize?.id !== selectedAddons.computeSize.id

  useEffect(() => {
    if (!isLoadingPaymentMethods && paymentMethods && paymentMethods.length > 0) {
      setSelectedPaymentMethodId(paymentMethods[0].id)
    }
  }, [isLoadingPaymentMethods, paymentMethods])

  useEffect(() => {
    getSubscriptionPreview()
  }, [selectedComputeSize, selectedPITRDuration, selectedCustomDomainOption, isSpendCapEnabled])

  const getSubscriptionPreview = async () => {
    if (!selectedTier) return

    const payload = formSubscriptionUpdatePayload(
      currentSubscription,
      selectedTier,
      selectedAddons,
      nonChangeableAddons,
      selectedPaymentMethodId,
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

  const resetCaptcha = () => {
    setCaptchaToken(null)
    captchaRef.current?.resetCaptcha()
  }

  const beforeConfirmPayment = async (): Promise<boolean> => {
    setIsSubmitting(true)
    let token = captchaToken

    try {
      if (!token) {
        const captchaResponse = await captchaRef.current?.execute({ async: true })
        token = captchaResponse?.response ?? null
        setCaptchaToken(token)
      }
    } catch (error) {
      setIsSubmitting(false)
      return false
    }

    setIsSubmitting(false)
    return true
  }

  const onConfirmPayment = async () => {
    setIsSubmitting(true)
    const payload = formSubscriptionUpdatePayload(
      currentSubscription,
      selectedTier,
      selectedAddons,
      nonChangeableAddons,
      selectedPaymentMethodId,
      projectRegion
    )
    const res = await patch(`${API_URL}/projects/${projectRef}/subscription`, payload)
    resetCaptcha()

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
        className="flex items-start justify-between w-full"
      >
        <div className="flex-grow mt-10">
          <div className="relative space-y-4">
            <div className="relative px-32 mx-auto space-y-4 2xl:max-w-5xl">
              <BackButton onClick={() => onSelectBack()} />
              <h4 className="text-lg text-scale-900 !mb-8">Change your project's subscription</h4>
            </div>

            <div
              className="px-32 pb-8 mx-auto space-y-8 overflow-y-auto 2xl:max-w-5xl"
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
                    {/* <p className="text-base text-scale-1100">
                        Your billing cycle will reset after payment
                      </p> */}
                  </>
                )}
              </div>
              <div className="flex items-center justify-between gap-16 px-6 py-4 border rounded border-panel-border-light border-panel-border-dark bg-panel-body-light drop-shadow-sm dark:bg-panel-body-dark">
                <div>
                  <div className="flex items-center space-x-2">
                    <p>Enable spend cap</p>
                    <IconHelpCircle
                      size={16}
                      strokeWidth={1.5}
                      className="transition opacity-50 cursor-pointer hover:opacity-100"
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
              {projectRegion !== 'af-south-1' && (
                <>
                  {currentAddons.supportPlan !== undefined && (
                    <>
                      <Divider light />
                      <SupportPlan currentOption={currentAddons.supportPlan} />
                    </>
                  )}
                  <Divider light />
                  <CustomDomainSelection
                    options={customDomainOptions}
                    currentOption={
                      isManagingProSubscription ? currentAddons.customDomains : undefined
                    }
                    selectedOption={selectedAddons.customDomains}
                    onSelectOption={setSelectedCustomDomainOption}
                  />
                  <Divider light />
                  <PITRDurationSelection
                    pitrDurationOptions={pitrDurationOptions}
                    currentPitrDuration={
                      isManagingProSubscription ? currentAddons.pitrDuration : undefined
                    }
                    selectedPitrDuration={selectedAddons.pitrDuration}
                    onSelectOption={setSelectedPITRDuration}
                  />
                  <Divider light />
                  <ComputeSizeSelection
                    computeSizes={computeSizes || []}
                    currentComputeSize={currentAddons.computeSize}
                    selectedComputeSize={selectedAddons.computeSize}
                    onSelectOption={setSelectedComputeSize}
                  />
                </>
              )}
            </div>
          </div>
        </div>
        <div className="w-[34rem]">
          <PaymentSummaryPanel
            isRefreshingPreview={isRefreshingPreview}
            subscriptionPreview={subscriptionPreview}
            isSpendCapEnabled={isSpendCapEnabled}
            // Current subscription configuration based on DB
            currentPlan={currentSubscription.tier}
            currentAddons={currentAddons}
            currentSubscription={currentSubscription}
            // Selected subscription configuration based on UI
            selectedPlan={selectedTier}
            selectedAddons={selectedAddons}
            paymentMethods={paymentMethods}
            isLoadingPaymentMethods={isLoadingPaymentMethods}
            selectedPaymentMethod={selectedPaymentMethodId}
            onSelectPaymentMethod={setSelectedPaymentMethodId}
            onSelectAddNewPaymentMethod={() => {
              setShowAddPaymentMethodModal(true)
            }}
            beforeConfirmPayment={beforeConfirmPayment}
            onConfirmPayment={onConfirmPayment}
            isSubmitting={isSubmitting}
            captcha={
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
            }
          />
        </div>
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
              <div className="border rounded border-scale-600 bg-scale-500">
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
                    <div className="flex w-[50%] items-center space-x-2">
                      <p className="text-sm">Auth MAUs</p>
                      <Tooltip.Root delayDuration={0}>
                        <Tooltip.Trigger>
                          <IconHelpCircle
                            size={16}
                            strokeWidth={1.5}
                            className="transition opacity-50 cursor-pointer hover:opacity-100"
                          />
                        </Tooltip.Trigger>
                        <Tooltip.Content side="bottom">
                          <Tooltip.Arrow className="radix-tooltip-arrow" />
                          <div
                            className={[
                              'rounded bg-scale-100 py-1 px-2 leading-none shadow', // background
                              'border border-scale-200 ', //border
                            ].join(' ')}
                          >
                            <span className="text-xs text-scale-1200">
                              Monthly Active Users: A user that has made an API request in the last
                              month
                            </span>
                          </div>
                        </Tooltip.Content>
                      </Tooltip.Root>
                    </div>
                    <p className="w-[25%] text-sm">100,000</p>
                    <p className="w-[25%] text-sm">$0.00325/user</p>
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
          <Modal.Separator />
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
