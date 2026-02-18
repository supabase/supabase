import HCaptcha from '@hcaptcha/react-hcaptcha'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, PaymentMethod, StripeElementsOptions } from '@stripe/stripe-js'
import { useParams } from 'common'
import { getStripeElementsAppearanceOptions } from 'components/interfaces/Billing/Payment/Payment.utils'
import {
  NewPaymentMethodElement,
  type PaymentMethodElementRef,
} from 'components/interfaces/Billing/Payment/PaymentMethods/NewPaymentMethodElement'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { useOrganizationPaymentMethodSetupIntent } from 'data/organizations/organization-payment-method-setup-intent-mutation'
import { useOrganizationPaymentMethodsQuery } from 'data/organizations/organization-payment-methods-query'
import { useOrganizationTaxIdQuery } from 'data/organizations/organization-tax-id-query'
import { SetupIntentResponse } from 'data/stripe/setup-intent-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH, STRIPE_PUBLIC_KEY } from 'lib/constants'
import { Loader, Plus } from 'lucide-react'
import { useTheme } from 'next-themes'
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
import { Checkbox_Shadcn_, Listbox } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

export interface PaymentMethodSelectionProps {
  selectedPaymentMethod?: string
  onSelectPaymentMethod: (id: string) => void
  layout?: 'vertical' | 'horizontal'
  readOnly: boolean
}

const PaymentMethodSelection = forwardRef(function PaymentMethodSelection(
  {
    selectedPaymentMethod,
    onSelectPaymentMethod,
    layout = 'vertical',
    readOnly,
  }: PaymentMethodSelectionProps,
  ref
) {
  const { slug } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaRef, setCaptchaRef] = useState<HCaptcha | null>(null)
  const [setupIntent, setSetupIntent] = useState<SetupIntentResponse | undefined>(undefined)
  const [useAsDefaultBillingAddress, setUseAsDefaultBillingAddress] = useState(true)
  const { resolvedTheme } = useTheme()
  const paymentRef = useRef<PaymentMethodElementRef | null>(null)
  const [setupNewPaymentMethod, setSetupNewPaymentMethod] = useState<boolean | null>(null)
  const { data: customerProfile, isPending: isCustomerProfileLoading } =
    useOrganizationCustomerProfileQuery({
      slug,
    })
  const { data: taxId, isPending: isCustomerTaxIdLoading } = useOrganizationTaxIdQuery({ slug })

  const { data: allPaymentMethods, isPending: isLoading } = useOrganizationPaymentMethodsQuery({
    slug,
  })

  const paymentMethods = useMemo(() => {
    if (!allPaymentMethods)
      return {
        data: [],
        defaultPaymentMethodId: null,
      }

    return {
      // force customer to put down address via payment method creation flow if they don't have an address set
      data: customerProfile?.address == null ? [] : allPaymentMethods.data,
      defaultPaymentMethodId: allPaymentMethods.data.some(
        (pm) => pm.id === allPaymentMethods.defaultPaymentMethodId
      )
        ? allPaymentMethods.defaultPaymentMethodId
        : null,
    }
  }, [allPaymentMethods, customerProfile])

  const captchaRefCallback = useCallback((node: any) => {
    setCaptchaRef(node)
  }, [])

  const { mutate: initSetupIntent, isPending: setupIntentLoading } =
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
      if (setupNewPaymentMethod && captchaRef) {
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
  }, [captchaRef, setupNewPaymentMethod])

  const resetCaptcha = () => {
    setCaptchaToken(null)
    captchaRef?.resetCaptcha()
  }

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
  const createPaymentMethod = async (): ReturnType<
    PaymentMethodElementRef['createPaymentMethod']
  > => {
    if (setupNewPaymentMethod || (paymentMethods?.data && paymentMethods.data.length === 0)) {
      const paymentResult = await paymentRef.current?.createPaymentMethod()

      if (!paymentResult) return paymentResult

      return {
        paymentMethod: paymentResult.paymentMethod,
        customerName: useAsDefaultBillingAddress ? paymentResult.customerName : null,
        address: useAsDefaultBillingAddress ? paymentResult.address : null,
        taxId: useAsDefaultBillingAddress ? paymentResult.taxId : null,
      }
    } else {
      return {
        paymentMethod: { id: selectedPaymentMethod } as PaymentMethod,
        customerName: useAsDefaultBillingAddress ? customerProfile?.billing_name || '' : null,
        address: useAsDefaultBillingAddress ? customerProfile?.address ?? null : null,
        taxId: useAsDefaultBillingAddress ? taxId ?? null : null,
      }
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
        {isLoading || isCustomerProfileLoading ? (
          <div className="flex items-center px-4 py-2 space-x-4 border rounded-md border-strong bg-surface-200">
            <Loader className="animate-spin" size={14} />
            <p className="text-sm text-foreground-light">Retrieving payment methods</p>
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
                setSetupNewPaymentMethod(true)
              }}
            >
              <Plus size={16} />
              <p className="transition text-foreground-light group-hover:text-foreground">
                Add new payment method
              </p>
            </div>
          </Listbox>
        ) : null}

        {stripePromise && setupIntent && customerProfile && (
          <>
            <Elements stripe={stripePromise} options={stripeOptionsPaymentMethod}>
              <NewPaymentMethodElement
                ref={paymentRef}
                email={selectedOrganization?.billing_email ?? undefined}
                readOnly={readOnly}
                customerName={customerProfile?.billing_name}
                currentAddress={customerProfile?.address}
                currentTaxId={taxId}
              />
            </Elements>

            {/* If the customer already has a billing address, optionally allow overwriting it - if they have no address, we use that as a default */}
            {customerProfile?.address != null && (
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox_Shadcn_
                  id="defaultBillingAddress"
                  checked={useAsDefaultBillingAddress}
                  onCheckedChange={() => setUseAsDefaultBillingAddress(!useAsDefaultBillingAddress)}
                />
                <label
                  htmlFor="defaultBillingAddress"
                  className="text-sm leading-none text-foreground-light"
                >
                  Use address as my org's billing address
                </label>
              </div>
            )}
          </>
        )}

        {(setupIntentLoading || isCustomerProfileLoading || isCustomerTaxIdLoading) && (
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
    </>
  )
})

PaymentMethodSelection.displayName = 'PaymentMethodSelection'

export default PaymentMethodSelection
