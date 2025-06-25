import { PermissionAction } from '@supabase/shared-types/out/constants'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'

import AddNewPaymentMethodModal from 'components/interfaces/Billing/Payment/AddNewPaymentMethodModal'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useOrganizationPaymentMethodsQuery } from 'data/organizations/organization-payment-methods-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH, STRIPE_PUBLIC_KEY } from 'lib/constants'
import { getURL } from 'lib/helpers'
import { AlertCircle, CreditCard, Loader, Plus } from 'lucide-react'
import { Listbox } from 'ui'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useIsHCaptchaLoaded } from 'stores/hcaptcha-loaded-store'
import { useOrganizationPaymentMethodSetupIntent } from 'data/organizations/organization-payment-method-setup-intent-mutation'
import { SetupIntentResponse } from 'data/stripe/setup-intent-mutation'
import { loadStripe, PaymentMethod, StripeElementsOptions } from '@stripe/stripe-js'
import { getStripeElementsAppearanceOptions } from 'components/interfaces/Billing/Payment/Payment.utils'
import { useTheme } from 'next-themes'
import { Elements } from '@stripe/react-stripe-js'
import { NewPaymentMethodElement } from '../PaymentMethods/NewPaymentMethodElement'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

export interface PaymentMethodSelectionProps {
  selectedPaymentMethod?: string
  onSelectPaymentMethod: (id: string) => void
  layout?: 'vertical' | 'horizontal'
  createPaymentMethodInline: boolean
  readOnly: boolean
}

const PaymentMethodSelection = forwardRef(function PaymentMethodSelection(
  {
    selectedPaymentMethod,
    onSelectPaymentMethod,
    layout = 'vertical',
    createPaymentMethodInline = false,
    readOnly,
  }: PaymentMethodSelectionProps,
  ref
) {
  const selectedOrganization = useSelectedOrganization()
  const slug = selectedOrganization?.slug
  const [showAddNewPaymentMethodModal, setShowAddNewPaymentMethodModal] = useState(false)
  const captchaLoaded = useIsHCaptchaLoaded()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaRef, setCaptchaRef] = useState<HCaptcha | null>(null)
  const [setupIntent, setSetupIntent] = useState<SetupIntentResponse | undefined>(undefined)
  const { resolvedTheme } = useTheme()
  const paymentRef = useRef<{ createPaymentMethod: () => Promise<PaymentMethod | undefined> }>(null)
  const [setupNewPaymentMethod, setSetupNewPaymentMethod] = useState<boolean | null>(null)

  const {
    data: paymentMethods,
    isLoading,
    refetch: refetchPaymentMethods,
  } = useOrganizationPaymentMethodsQuery({ slug })

  const captchaRefCallback = useCallback((node: any) => {
    setCaptchaRef(node)
  }, [])

  const { mutate: initSetupIntent, isLoading: setupIntentLoading } =
    useOrganizationPaymentMethodSetupIntent({
      onSuccess: (intent) => {
        setSetupIntent(intent)
      },
      onError: (error) => {
        toast.error(`Failed to setup intent: ${error.message}`)
      },
    })

  useEffect(() => {
    if (paymentMethods?.data && paymentMethods.data.length === 0 && setupNewPaymentMethod == null) {
      setSetupNewPaymentMethod(true)
    }
  }, [paymentMethods])

  useEffect(() => {
    const loadSetupIntent = async (hcaptchaToken: string | undefined) => {
      const slug = selectedOrganization?.slug
      if (!slug) return console.error('Slug is required')
      if (!hcaptchaToken) return console.error('HCaptcha token required')

      setSetupIntent(undefined)
      initSetupIntent({ slug: slug!, hcaptchaToken })
    }

    const loadPaymentForm = async () => {
      if (setupNewPaymentMethod && createPaymentMethodInline && captchaRef && captchaLoaded) {
        let token = captchaToken

        try {
          if (!token) {
            const captchaResponse = await captchaRef.execute({ async: true })
            token = captchaResponse?.response ?? null
          }
        } catch (error) {
          return
        }

        await loadSetupIntent(token ?? undefined)
        resetCaptcha()
      }
    }

    loadPaymentForm()
  }, [createPaymentMethodInline, captchaRef, captchaLoaded, setupNewPaymentMethod])

  const resetCaptcha = () => {
    setCaptchaToken(null)
    captchaRef?.resetCaptcha()
  }

  const canUpdatePaymentMethods = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.payment_methods'
  )

  const stripeOptionsPaymentMethod: StripeElementsOptions = useMemo(
    () =>
      ({
        clientSecret: setupIntent ? setupIntent.client_secret! : '',
        appearance: getStripeElementsAppearanceOptions(resolvedTheme),
        paymentMethodCreation: 'manual',
      }) as const,
    [setupIntent, resolvedTheme]
  )

  useEffect(() => {
    if (paymentMethods?.data && paymentMethods.data.length > 0) {
      const selectedPaymentMethodExists = paymentMethods.data.some(
        (it) => it.id === selectedPaymentMethod
      )

      if (!selectedPaymentMethod || !selectedPaymentMethodExists) {
        const defaultPaymentMethod = paymentMethods.data.find((method) => method.is_default)
        if (defaultPaymentMethod !== undefined) {
          onSelectPaymentMethod(defaultPaymentMethod.id)
        } else {
          onSelectPaymentMethod(paymentMethods.data[0].id)
        }
      }
    }
  }, [selectedPaymentMethod, paymentMethods, onSelectPaymentMethod])

  // If createPaymentMethod already exists, use it. Otherwise, define it here.
  const createPaymentMethod = async () => {
    if (setupNewPaymentMethod || (paymentMethods?.data && paymentMethods.data.length === 0)) {
      return paymentRef.current?.createPaymentMethod()
    } else {
      return { id: selectedPaymentMethod }
    }
  }

  useImperativeHandle(ref, () => ({
    createPaymentMethod,
  }))

  return (
    <>
      <HCaptcha
        ref={captchaRefCallback}
        sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
        size="invisible"
        onOpen={() => {
          // [Joshen] This is to ensure that hCaptcha popup remains clickable
          if (document !== undefined) document.body.classList.add('!pointer-events-auto')
        }}
        onClose={() => {
          setSetupIntent(undefined)
          if (document !== undefined) document.body.classList.remove('!pointer-events-auto')
        }}
        onVerify={(token) => {
          setCaptchaToken(token)
          if (document !== undefined) document.body.classList.remove('!pointer-events-auto')
        }}
        onExpire={() => {
          setCaptchaToken(null)
        }}
      />

      <div>
        {isLoading ? (
          <div className="flex items-center px-4 py-2 space-x-4 border rounded-md border-strong bg-surface-200">
            <Loader className="animate-spin" size={14} />
            <p className="text-sm text-foreground-light">Retrieving payment methods</p>
          </div>
        ) : paymentMethods?.data.length === 0 && !createPaymentMethodInline ? (
          <div className="flex items-center justify-between px-4 py-2 border border-dashed rounded-md bg-alternative">
            <div className="flex items-center space-x-4 text-foreground-light">
              <AlertCircle size={16} strokeWidth={1.5} />
              <p className="text-sm">No payment methods</p>
            </div>

            <ButtonTooltip
              type="default"
              disabled={!canUpdatePaymentMethods}
              icon={<CreditCard />}
              onClick={() => {
                if (createPaymentMethodInline) {
                  setSetupNewPaymentMethod(true)
                } else {
                  setShowAddNewPaymentMethodModal(true)
                }
              }}
              htmlType="button"
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canUpdatePaymentMethods ? (
                    <div className="w-48 text-center">
                      <span>
                        You need additional permissions to add new payment methods to this
                        organization
                      </span>
                    </div>
                  ) : undefined,
                },
              }}
            >
              Add new
            </ButtonTooltip>
          </div>
        ) : paymentMethods?.data && paymentMethods?.data.length > 0 && !setupNewPaymentMethod ? (
          <Listbox
            layout={layout}
            label="Payment method"
            value={selectedPaymentMethod}
            onChange={onSelectPaymentMethod}
            className="flex items-center"
          >
            {paymentMethods?.data.map((method: any) => {
              const label = `•••• •••• •••• ${method.card.last4}`
              return (
                <Listbox.Option
                  key={method.id}
                  label={label}
                  value={method.id}
                  addOnBefore={() => {
                    return (
                      <img
                        alt="Credit Card Brand"
                        src={`${BASE_PATH}/img/payment-methods/${method.card.brand
                          .replace(' ', '-')
                          .toLowerCase()}.png`}
                        width="32"
                      />
                    )
                  }}
                >
                  <div>{label}</div>
                </Listbox.Option>
              )
            })}
            <div
              className="flex items-center px-3 py-2 space-x-2 transition cursor-pointer group hover:bg-surface-300"
              onClick={() => {
                if (createPaymentMethodInline) {
                  setSetupNewPaymentMethod(true)
                } else {
                  setShowAddNewPaymentMethodModal(true)
                }
              }}
            >
              <Plus size={16} />
              <p className="transition text-foreground-light group-hover:text-foreground">
                Add new payment method
              </p>
            </div>
          </Listbox>
        ) : null}

        {stripePromise && setupIntent && (
          <Elements stripe={stripePromise} options={stripeOptionsPaymentMethod}>
            <NewPaymentMethodElement
              ref={paymentRef}
              pending_subscription_flow_enabled={true}
              email={selectedOrganization?.billing_email ?? undefined}
              readOnly={readOnly}
            />
          </Elements>
        )}

        {setupIntentLoading && (
          <div className="space-y-2">
            <ShimmeringLoader className="h-10" />
            <div className="grid grid-cols-2 gap-4">
              <ShimmeringLoader className="h-10" />
              <ShimmeringLoader className="h-10" />
            </div>
            <ShimmeringLoader className="h-10" />
          </div>
        )}
      </div>

      <AddNewPaymentMethodModal
        visible={showAddNewPaymentMethodModal}
        returnUrl={`${getURL()}/org/${selectedOrganization?.slug}/billing?panel=subscriptionPlan&source=paymentMethod`}
        onCancel={() => setShowAddNewPaymentMethodModal(false)}
        autoMarkAsDefaultPaymentMethod={true}
        onConfirm={async () => {
          setShowAddNewPaymentMethodModal(false)
          toast.success('Successfully added new payment method')
          const { data: refetchedPaymentMethods } = await refetchPaymentMethods()
          if (refetchedPaymentMethods?.data?.length) {
            // Preselect the card that was just added
            const mostRecentPaymentMethod = refetchedPaymentMethods?.data.reduce(
              (prev, current) => (prev.created > current.created ? prev : current),
              refetchedPaymentMethods.data[0]
            )
            onSelectPaymentMethod(mostRecentPaymentMethod.id)
          }
        }}
      />
    </>
  )
})

PaymentMethodSelection.displayName = 'PaymentMethodSelection'

export default PaymentMethodSelection
