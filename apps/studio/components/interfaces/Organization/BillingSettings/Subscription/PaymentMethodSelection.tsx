import HCaptcha from '@hcaptcha/react-hcaptcha'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, PaymentMethod, StripeElementsOptions } from '@stripe/stripe-js'
import { useParams } from 'common'
import { LoaderIcon, PlusIcon } from 'lucide-react'
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
import { Button, Checkbox, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { getStripeElementsAppearanceOptions } from '@/components/interfaces/Billing/Payment/Payment.utils'
import { CardBrandIcon } from '@/components/interfaces/Billing/Payment/PaymentMethods/CreditCard'
import {
  NewPaymentMethodElement,
  type PaymentMethodElementRef,
} from '@/components/interfaces/Billing/Payment/PaymentMethods/NewPaymentMethodElement'
import { useOrganizationCustomerProfileQuery } from '@/data/organizations/organization-customer-profile-query'
import { useOrganizationCustomerProfileUpdateMutation } from '@/data/organizations/organization-customer-profile-update-mutation'
import { useOrganizationPaymentMethodSetupIntent } from '@/data/organizations/organization-payment-method-setup-intent-mutation'
import { useOrganizationPaymentMethodsQuery } from '@/data/organizations/organization-payment-methods-query'
import { useOrganizationTaxIdQuery } from '@/data/organizations/organization-tax-id-query'
import type { CustomerAddress, CustomerTaxId } from '@/data/organizations/types'
import { SetupIntentResponse } from '@/data/stripe/setup-intent-mutation'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { STRIPE_PUBLIC_KEY } from '@/lib/constants'
import { useOrgSettingsPageStateSnapshot } from '@/state/organization-settings'

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

type SavedPaymentMethod = { card?: { last4?: string; exp_month?: number; exp_year?: number } }

/** e.g. "•••• 4242 · expires 08/28" — enough to tell saved cards apart at a glance. */
const getCardLabel = (method: SavedPaymentMethod) => {
  const card = method.card
  if (!card?.last4) return 'Saved payment method'

  const digits = `•••• ${card.last4}`
  if (!card.exp_month || !card.exp_year) return digits

  const month = String(card.exp_month).padStart(2, '0')
  const year = String(card.exp_year).slice(-2)
  return `${digits} · expires ${month}/${year}`
}

export interface PaymentMethodSelectionProps {
  selectedPaymentMethod?: string
  /** Field label above the saved-card select. Pass null when the surrounding section already names it. */
  label?: string | null
  onSelectPaymentMethod: (id: string) => void
  layout?: 'vertical' | 'horizontal'
  readOnly: boolean
  onAddressChange?: (address: CustomerAddress) => void
  onTaxIdChange?: (taxId: CustomerTaxId | null) => void
  useAsDefaultBillingAddress: boolean
  onUseAsDefaultBillingAddressChange: (useAsDefault: boolean) => void
  onClose?: () => void
}

const PaymentMethodSelection = forwardRef(function PaymentMethodSelection(
  {
    selectedPaymentMethod,
    label = 'Payment method',
    onSelectPaymentMethod,
    layout = 'vertical',
    readOnly,
    onAddressChange,
    onTaxIdChange,
    useAsDefaultBillingAddress,
    onUseAsDefaultBillingAddressChange,
    onClose,
  }: PaymentMethodSelectionProps,
  ref
) {
  const { slug } = useParams()
  const snap = useOrgSettingsPageStateSnapshot()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaRef, setCaptchaRef] = useState<HCaptcha | null>(null)
  const [setupIntent, setSetupIntent] = useState<SetupIntentResponse | undefined>(undefined)
  const { resolvedTheme } = useTheme()
  const paymentRef = useRef<PaymentMethodElementRef | null>(null)
  // Stays null until the customer picks "Add new payment method" themselves. The default
  // comes from whether they have a saved card, which `isAddingNewPaymentMethod` derives
  // below — deciding it here would mean deciding it off loading state.
  const [hasChosenNewPaymentMethod, setHasChosenNewPaymentMethod] = useState<boolean | null>(null)
  const {
    data: customerProfile,
    isPending: isCustomerProfileLoading,
    isSuccess: isCustomerProfileLoaded,
    isError: isCustomerProfileError,
  } = useOrganizationCustomerProfileQuery({
    slug,
  })
  const {
    data: taxId,
    isPending: isCustomerTaxIdLoading,
    isError: isTaxIdError,
  } = useOrganizationTaxIdQuery({ slug })
  const { mutateAsync: updateCustomerProfile } = useOrganizationCustomerProfileUpdateMutation({
    onError: () => {},
  })

  const {
    data: allPaymentMethods,
    isPending: isLoading,
    isSuccess: arePaymentMethodsLoaded,
    isError: isPaymentMethodsError,
  } = useOrganizationPaymentMethodsQuery({
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

  /**
   * `paymentMethods.data` is an empty array while either query is in flight — the memo
   * above blanks it until the customer profile loads — so an organization with saved
   * cards looks card-less until both land, which would open the new card form over the
   * top of a perfectly good saved card.
   *
   * Checked as settled rather than "not pending" on purpose: both queries sit disabled
   * (and so pending) until the permission check resolves, and that window reads as
   * card-less too. A failed query counts as settled, so a billing outage still leaves
   * the customer a way to enter a card.
   */
  const arePaymentMethodsResolved =
    (arePaymentMethodsLoaded || isPaymentMethodsError) &&
    (isCustomerProfileLoaded || isCustomerProfileError)
  const isAddingNewPaymentMethod =
    hasChosenNewPaymentMethod ?? (arePaymentMethodsResolved && paymentMethods.data.length === 0)

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
    const loadSetupIntent = async (hcaptchaToken: string | undefined) => {
      const slug = selectedOrganization?.slug
      if (!slug) return console.error('Slug is required')
      if (!hcaptchaToken) return console.error('HCaptcha token required')

      setSetupIntent(undefined)
      initSetupIntent({ slug: slug!, hcaptchaToken })
    }

    const loadPaymentForm = async () => {
      if (isAddingNewPaymentMethod && captchaRef) {
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
  }, [captchaRef, isAddingNewPaymentMethod])

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

  const getFormValues = async (): ReturnType<PaymentMethodElementRef['getFormValues']> => {
    if (isAddingNewPaymentMethod) {
      return paymentRef.current?.getFormValues()
    } else {
      return {
        address: customerProfile?.address ?? ({} as CustomerAddress),
        customerName: customerProfile?.billing_name || '',
        taxId: taxId ?? null,
      }
    }
  }

  // Validate address/tax ID with a dry run before proceeding with Stripe,
  // so validation errors (e.g. invalid tax ID) block the flow early.
  const validateBillingProfile = async (): Promise<boolean> => {
    if (!useAsDefaultBillingAddress) return true

    if (isTaxIdError || isCustomerTaxIdLoading) {
      toast.error(
        isTaxIdError
          ? 'Unable to load current tax ID. Please try again.'
          : 'Tax ID is still loading. Please wait and try again.'
      )
      return false
    }

    const formValues = await getFormValues()
    if (!formValues) return false

    try {
      await updateCustomerProfile({
        slug,
        address: formValues.address,
        billing_name: formValues.customerName,
        tax_id: formValues.taxId,
        dry_run: true,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to validate billing profile'
      if (errorMessage.includes('The tax ID type does not match the billing address country')) {
        toast.error(
          <div>
            <p>{errorMessage} Update your billing address or tax ID before upgrading your plan.</p>
            <Button
              className="mt-2"
              onClick={() => {
                if (onClose) {
                  onClose()
                  snap.setPanelKey(undefined)
                  const el = document.getElementById('address')
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              }}
            >
              Update tax ID
            </Button>
          </div>
        )
      } else {
        toast.error(errorMessage)
      }
      return false
    }

    return true
  }

  // If createPaymentMethod already exists, use it. Otherwise, define it here.
  const createPaymentMethod = async (): ReturnType<
    PaymentMethodElementRef['createPaymentMethod']
  > => {
    if (isAddingNewPaymentMethod) {
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
        address: useAsDefaultBillingAddress ? (customerProfile?.address ?? null) : null,
        taxId: useAsDefaultBillingAddress ? (taxId ?? null) : null,
      }
    }
  }

  useImperativeHandle(ref, () => ({
    createPaymentMethod,
    validateBillingProfile,
  }))

  return (
    <>
      <HCaptcha
        ref={captchaRefCallback}
        sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
        size="invisible"
        onOpen={() => {
          // [Joshen] This is to ensure that hCaptcha popup remains clickable
          if (document !== undefined) document.body.classList.add('pointer-events-auto!')
        }}
        onClose={() => {
          setSetupIntent(undefined)
          if (document !== undefined) document.body.classList.remove('pointer-events-auto!')
        }}
        onVerify={(token) => {
          setCaptchaToken(token)
          if (document !== undefined) document.body.classList.remove('pointer-events-auto!')
        }}
        onExpire={() => {
          setCaptchaToken(null)
        }}
      />

      <div>
        {isLoading || isCustomerProfileLoading ? (
          <div className="flex items-center px-4 py-2 space-x-4 border rounded-md border-strong bg-surface-200">
            <LoaderIcon className="animate-spin" size={14} />
            <p className="text-sm text-foreground-light">Retrieving payment methods</p>
          </div>
        ) : paymentMethods.data.length > 0 && !isAddingNewPaymentMethod ? (
          <FormItemLayout
            id="payment-method"
            isReactForm={false}
            layout={layout}
            label={label ?? undefined}
            className="gap-[2px]"
            size="tiny"
          >
            <Select
              value={selectedPaymentMethod}
              onValueChange={(value) => {
                if (value === 'new') {
                  setHasChosenNewPaymentMethod(true)
                  return
                }
                onSelectPaymentMethod(value)
              }}
            >
              <SelectTrigger
                id="payment-method"
                size="small"
                aria-label={label ?? 'Payment method'}
              >
                <SelectValue className="flex gap-2" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods?.data.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    <div className="flex items-center gap-2">
                      <CardBrandIcon brand={method.card?.brand} />
                      <span translate="no">{getCardLabel(method)}</span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="new">
                  <div className="flex items-center gap-2">
                    <PlusIcon size={16} />
                    <p className="transition text-foreground-light group-hover:text-foreground">
                      Add new payment method
                    </p>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </FormItemLayout>
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
                onAddressChange={onAddressChange}
                onTaxIdChange={onTaxIdChange}
              />
            </Elements>

            {/* If the customer already has a billing address, optionally allow overwriting it - if they have no address, we use that as a default */}
            {customerProfile?.address != null && (
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="defaultBillingAddress"
                  checked={useAsDefaultBillingAddress}
                  onCheckedChange={() => {
                    onUseAsDefaultBillingAddressChange(!useAsDefaultBillingAddress)
                  }}
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
