import { FC, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { Transition } from '@headlessui/react'

import { useStore } from 'hooks'
import { getURL } from 'lib/helpers'
import { post, patch } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import HCaptcha from '@hcaptcha/react-hcaptcha'

import Divider from 'components/ui/Divider'
import { SubscriptionAddon } from './AddOns/AddOns.types'
import {
  formatComputeSizes,
  formatCustomDomainOptions,
  formatPITROptions,
} from './AddOns/AddOns.utils'
import {
  AddNewPaymentMethodModal,
  ComputeSizeSelection,
  PITRDurationSelection,
  StripeSubscription,
  PaymentSummaryPanel,
  UpdateSuccess,
  CustomDomainSelection,
} from './'
import { PaymentMethod, SubscriptionPreview } from './Billing.types'
import { formSubscriptionUpdatePayload, getCurrentAddons } from './Billing.utils'
import SupportPlan from './AddOns/SupportPlan'

interface Props {
  products: { tiers: any[]; addons: SubscriptionAddon[] }
  paymentMethods?: PaymentMethod[]
  currentSubscription: StripeSubscription
  isLoadingPaymentMethods: boolean
}

const EnterpriseUpdate: FC<Props> = ({
  products,
  paymentMethods,
  currentSubscription,
  isLoadingPaymentMethods,
}) => {
  const { app, ui } = useStore()
  const router = useRouter()

  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)

  const projectId = ui.selectedProject?.id ?? -1
  const projectRef = ui.selectedProject?.ref ?? 'default'
  const projectRegion = ui.selectedProject?.region ?? ''

  const { addons } = products
  const computeSizes = formatComputeSizes(addons)
  const pitrDurationOptions = formatPITROptions(addons)
  const customDomainOptions = formatCustomDomainOptions(addons)
  const currentAddons = getCurrentAddons(currentSubscription, addons)

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

  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<any>()
  const [subscriptionPreview, setSubscriptionPreview] = useState<SubscriptionPreview>()

  const [isRefreshingPreview, setIsRefreshingPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccessful, setIsSuccessful] = useState(false)
  const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState(false)

  const isChangingComputeSize = currentAddons.computeSize?.id !== selectedAddons.computeSize.id

  useEffect(() => {
    getSubscriptionPreview()
  }, [selectedComputeSize, selectedPITRDuration, selectedCustomDomainOption])

  useEffect(() => {
    if (!isLoadingPaymentMethods && paymentMethods && paymentMethods.length > 0) {
      setSelectedPaymentMethodId(paymentMethods[0].id)
    }
  }, [isLoadingPaymentMethods, paymentMethods])

  const getSubscriptionPreview = async () => {
    // For enterprise, only tier will be fixed based on current subscription
    // Only allow add-ons changing
    const payload = {
      ...formSubscriptionUpdatePayload(
        currentSubscription,
        null,
        selectedAddons,
        nonChangeableAddons,
        selectedPaymentMethodId,
        projectRegion
      ),
      tier: currentSubscription.tier.price_id,
    }

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

  // Last todo to support enterprise billing on dashboard + E2E test
  const onConfirmPayment = async () => {
    setIsSubmitting(true)
    const payload = {
      ...formSubscriptionUpdatePayload(
        currentSubscription,
        null,
        selectedAddons,
        nonChangeableAddons,
        selectedPaymentMethodId,
        projectRegion
      ),
      tier: currentSubscription.tier.price_id,
    }
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
        className="flex w-full items-start justify-between"
      >
        <div className="flex-grow mt-10">
          <div className="relative space-y-4">
            <div className="space-y-8">
              <div className="space-y-4 2xl:max-w-5xl mx-auto px-32">
                <h4 className="text-lg text-scale-900 !mb-8">Change your project's subscription</h4>
              </div>

              <div
                className="space-y-8 overflow-y-auto pb-8 2xl:max-w-5xl mx-auto px-32"
                style={{ height: 'calc(100vh - 6.4rem - 57px)' }}
              >
                <h3 className="text-xl">
                  Managing your <span className="text-brand-900">Enterprise</span> plan
                </h3>
                <div
                  className={[
                    'bg-panel-body-light dark:bg-panel-body-dark border-panel-border-light border-panel-border-dark',
                    'flex max-w-[600px] items-center justify-between gap-16 rounded border px-6 py-4 drop-shadow-sm',
                  ].join(' ')}
                >
                  <p className="text-sm">
                    If you'd like to change your subscription away from enterprise, please reach out
                    to <span className="text-brand-900">enterprise@supabase.io</span> with your
                    request.
                  </p>
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
                      currentOption={currentAddons.customDomains}
                      selectedOption={selectedAddons.customDomains}
                      onSelectOption={setSelectedCustomDomainOption}
                    />
                    <Divider light />
                    <PITRDurationSelection
                      pitrDurationOptions={pitrDurationOptions}
                      currentPitrDuration={currentAddons.pitrDuration}
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
        </div>
        <div className="w-[34rem]">
          <PaymentSummaryPanel
            isSpendCapEnabled={true}
            isSubmitting={isSubmitting}
            isRefreshingPreview={isRefreshingPreview}
            currentSubscription={currentSubscription}
            subscriptionPreview={subscriptionPreview}
            // Current subscription configuration based on DB
            currentPlan={currentSubscription.tier}
            currentAddons={currentAddons}
            // Selected subscription configuration based on UI
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
    </>
  )
}

export default EnterpriseUpdate
