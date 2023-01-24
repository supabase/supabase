import { FC, useEffect, useRef, useState } from 'react'
import { Transition } from '@headlessui/react'
import { useRouter } from 'next/router'

import { useStore, useFlag } from 'hooks'
import { post, patch } from 'lib/common/fetch'
import { API_URL, PRICING_TIER_PRODUCT_IDS, PROJECT_STATUS } from 'lib/constants'
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

const TeamUpgrade: FC<Props> = ({
  products,
  paymentMethods,
  currentSubscription,
  isLoadingPaymentMethods,
  onSelectBack,
}) => {
  const { app, ui } = useStore()
  const router = useRouter()

  // Team tier is enabled when the flag is turned on OR the user is already on the team tier (manually assigned by us)
  const userIsOnTeamTier =
    currentSubscription?.tier?.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.TEAM
  const teamTierEnabled = userIsOnTeamTier || useFlag('teamTier')

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

  const [isRefreshingPreview, setIsRefreshingPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccessful, setIsSuccessful] = useState(false)
  const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState(false)

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

  const selectedTier = products?.tiers.find((tier: any) => tier.id === STRIPE_PRODUCT_IDS.TEAM)

  const isManagingTeamSubscription = currentSubscription.tier.prod_id === STRIPE_PRODUCT_IDS.TEAM

  const isChangingComputeSize = currentAddons.computeSize?.id !== selectedAddons.computeSize.id

  useEffect(() => {
    if (!isLoadingPaymentMethods && paymentMethods && paymentMethods.length > 0) {
      setSelectedPaymentMethodId(paymentMethods[0].id)
    }
  }, [isLoadingPaymentMethods, paymentMethods])

  useEffect(() => {
    getSubscriptionPreview()
  }, [selectedComputeSize, selectedPITRDuration, selectedCustomDomainOption])

  const getSubscriptionPreview = async () => {
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
    if (!teamTierEnabled) {
      return ui.setNotification({
        category: 'error',
        message: 'Team Plan is not enabled yet.',
      })
    }
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
            <div className="px-32 mx-auto space-y-4 2xl:max-w-5xl">
              <BackButton onClick={() => onSelectBack()} />
              <h4 className="text-lg text-scale-900 !mb-8">Change your project's subscription</h4>
            </div>

            <div
              className="px-32 pb-8 mx-auto space-y-8 overflow-y-auto 2xl:max-w-5xl"
              style={{ height: 'calc(100vh - 9rem - 57px)' }}
            >
              <div className="space-y-2">
                {!isManagingTeamSubscription ? (
                  <>
                    <h3 className="text-xl">
                      Welcome to <span className="text-brand-900">Team</span>
                    </h3>
                    <p className="text-base text-scale-1100">
                      Your new subscription will begin immediately after payment
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-3xl">
                      Managing your <span className="text-brand-900">Team</span> plan
                    </h3>
                  </>
                )}
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
                      isManagingTeamSubscription ? currentAddons.customDomains : undefined
                    }
                    selectedOption={selectedAddons.customDomains}
                    onSelectOption={setSelectedCustomDomainOption}
                  />
                  <Divider light />
                  <PITRDurationSelection
                    pitrDurationOptions={pitrDurationOptions}
                    currentPitrDuration={
                      isManagingTeamSubscription ? currentAddons.pitrDuration : undefined
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
            isSpendCapEnabled={false}
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
        returnUrl={`${getURL()}/project/${projectRef}/settings/billing/update/team`}
        onCancel={() => setShowAddPaymentMethodModal(false)}
      />
    </>
  )
}

export default TeamUpgrade
