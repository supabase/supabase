import HCaptcha from '@hcaptcha/react-hcaptcha'
import { zodResolver } from '@hookform/resolvers/zod'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, PaymentIntentResult } from '@stripe/stripe-js'
import { PermissionAction, SupportCategories } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { AlertCircle, Info } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Form,
  FormField,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { z } from 'zod'

import type { PaymentMethodElementRef } from '../../Billing/Payment/PaymentMethods/NewPaymentMethodElement'
import PaymentMethodSelection from './Subscription/PaymentMethodSelection'
import { ChargeBreakdown } from '@/components/interfaces/Billing/ChargeBreakdown'
import { getStripeElementsAppearanceOptions } from '@/components/interfaces/Billing/Payment/Payment.utils'
import { PaymentConfirmation } from '@/components/interfaces/Billing/Payment/PaymentConfirmation'
import { NO_PROJECT_MARKER } from '@/components/interfaces/Support/SupportForm.utils'
import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useOrganizationCreditTopUpMutation } from '@/data/organizations/organization-credit-top-up-mutation'
import { useCreditTopUpPreview } from '@/data/organizations/organization-credit-top-up-preview'
import type { CustomerAddress, CustomerTaxId } from '@/data/organizations/types'
import { subscriptionKeys } from '@/data/subscriptions/keys'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { STRIPE_PUBLIC_KEY } from '@/lib/constants'
import { formatCurrency } from '@/lib/helpers'

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

const FORM_ID = 'credit-top-up'
const MIN_TOP_UP_AMOUNT = 300
const MAX_TOP_UP_AMOUNT = 2000

const FormSchema = z.object({
  amount: z.coerce
    .number()
    .gte(MIN_TOP_UP_AMOUNT, `Amount must be between $${MIN_TOP_UP_AMOUNT} - $${MAX_TOP_UP_AMOUNT}.`)
    .lte(MAX_TOP_UP_AMOUNT, `Amount must be between $${MIN_TOP_UP_AMOUNT} - $${MAX_TOP_UP_AMOUNT}.`)
    .int('Amount must be a whole number.'),
  paymentMethod: z.string(),
})

type CreditTopUpForm = z.infer<typeof FormSchema>

export const CreditTopUp = ({ slug }: { slug: string | undefined }) => {
  const { resolvedTheme } = useTheme()
  const queryClient = useQueryClient()
  const paymentMethodSelectionRef = useRef<{
    createPaymentMethod: PaymentMethodElementRef['createPaymentMethod']
    validateBillingProfile: () => Promise<boolean>
  }>(null)

  const { can: canTopUpCredits, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const {
    mutateAsync: topUpCredits,
    isPending: executingTopUp,
    error: errorInitiatingTopUp,
  } = useOrganizationCreditTopUpMutation({})

  const form = useForm<CreditTopUpForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      amount: 300,
      paymentMethod: '',
    },
  })

  const [topUpModalVisible, setTopUpModalVisible] = useState(false)
  const [useAsDefaultBillingAddress, setUseAsDefaultBillingAddress] = useState(true)
  const [paymentConfirmationLoading, setPaymentConfirmationLoading] = useState(false)

  const [latestAddress, setLatestAddress] = useState<CustomerAddress>()
  const [latestTaxId, setLatestTaxId] = useState<CustomerTaxId | null>()

  const billingAddress = useAsDefaultBillingAddress ? latestAddress : undefined
  const billingTaxId = useAsDefaultBillingAddress ? latestTaxId : null
  const debouncedAddress = useDebounce(billingAddress, 1000)
  const debouncedTaxId = useDebounce(billingTaxId, 1000)

  const watchedAmount = form.watch('amount')
  const debouncedAmount = useDebounce(watchedAmount, 1000)
  const parsedAmount = Number(debouncedAmount)
  const validAmount =
    !Number.isNaN(parsedAmount) &&
    Number.isInteger(parsedAmount) &&
    parsedAmount >= MIN_TOP_UP_AMOUNT &&
    parsedAmount <= MAX_TOP_UP_AMOUNT
      ? parsedAmount
      : undefined

  const isPreviewStale =
    watchedAmount !== debouncedAmount ||
    billingAddress !== debouncedAddress ||
    billingTaxId !== debouncedTaxId

  const handleAddressChange = useCallback((address: CustomerAddress) => {
    setLatestAddress(address)
  }, [])

  const handleTaxIdChange = useCallback((taxId: CustomerTaxId | null) => {
    setLatestTaxId(taxId)
  }, [])

  const {
    data: creditPreview,
    isFetching: creditPreviewIsFetching,
    isSuccess: creditPreviewInitialized,
  } = useCreditTopUpPreview(
    {
      slug,
      amount: validAmount,
      address: debouncedAddress,
      taxId: debouncedTaxId ?? undefined,
    },
    { enabled: topUpModalVisible && !!validAmount }
  )
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaRef, setCaptchaRef] = useState<HCaptcha | null>(null)

  const captchaRefCallback = useCallback((node: any) => {
    setCaptchaRef(node)
  }, [])

  const resetCaptcha = () => {
    setCaptchaToken(null)
    captchaRef?.resetCaptcha()
  }

  const initHcaptcha = async () => {
    if (topUpModalVisible && captchaRef) {
      let token = captchaToken

      try {
        if (!token) {
          const captchaResponse = await captchaRef.execute({ async: true })
          token = captchaResponse?.response ?? null
          setCaptchaToken(token)
          return token
        }
      } catch (error) {
        return token
      }

      return token
    }
  }

  useEffect(() => {
    initHcaptcha()
  }, [topUpModalVisible, captchaRef])

  const [paymentIntentSecret, setPaymentIntentSecret] = useState('')
  const [paymentIntentConfirmation, setPaymentIntentConfirmation] = useState<PaymentIntentResult>()

  const onSubmit: SubmitHandler<CreditTopUpForm> = async ({ amount }) => {
    setPaymentIntentConfirmation(undefined)

    const token = await initHcaptcha()

    const isValid = await paymentMethodSelectionRef.current?.validateBillingProfile()
    if (!isValid) return

    const paymentMethodResult = await paymentMethodSelectionRef.current?.createPaymentMethod()
    if (!paymentMethodResult) {
      return
    }

    await topUpCredits(
      {
        slug,
        amount,
        payment_method_id: paymentMethodResult.paymentMethod.id,
        hcaptchaToken: token,
        address: paymentMethodResult.address,
        tax_id: paymentMethodResult.taxId ?? undefined,
        billing_name: paymentMethodResult.customerName,
      },
      {
        onSuccess: (data) => {
          if (data.status === 'succeeded') {
            onSuccessfulPayment()
          } else {
            setPaymentIntentSecret(data.payment_intent_secret || '')
          }

          resetCaptcha()
        },
      }
    )
  }

  const options = useMemo(() => {
    return {
      clientSecret: paymentIntentSecret,
      appearance: getStripeElementsAppearanceOptions(resolvedTheme),
    } as any
  }, [paymentIntentSecret, resolvedTheme])

  const onTopUpDialogVisibilityChange = (visible: boolean) => {
    setTopUpModalVisible(visible)
    if (!visible) {
      setCaptchaRef(null)
      setPaymentIntentConfirmation(undefined)
      setPaymentIntentSecret('')
      setLatestAddress(undefined)
      setLatestTaxId(null)
    }
  }

  const paymentIntentConfirmed = (paymentIntentConfirmation: PaymentIntentResult) => {
    // Reset payment intent secret to ensure another attempt works as expected
    setPaymentIntentSecret('')
    setPaymentIntentConfirmation(paymentIntentConfirmation)

    if (paymentIntentConfirmation.paymentIntent?.status === 'succeeded') {
      onSuccessfulPayment()
    }
  }

  const onSuccessfulPayment = async () => {
    onTopUpDialogVisibilityChange(false)
    await queryClient.invalidateQueries({ queryKey: subscriptionKeys.orgSubscription(slug) })
    toast.success(
      'Successfully topped up balance. It may take a minute to reflect in your account.'
    )
  }

  return (
    <Dialog open={topUpModalVisible} onOpenChange={(open) => onTopUpDialogVisibilityChange(open)}>
      <DialogTrigger asChild>
        <ButtonTooltip
          type="default"
          className="pointer-events-auto"
          disabled={!canTopUpCredits || !isPermissionsLoaded}
          tooltip={{
            content: {
              side: 'bottom',
              text:
                isPermissionsLoaded && !canTopUpCredits
                  ? 'You need additional permissions to top up credits'
                  : undefined,
            },
          }}
        >
          Top Up
        </ButtonTooltip>
      </DialogTrigger>

      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <HCaptcha
          ref={captchaRefCallback}
          sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
          size="invisible"
          onOpen={() => {
            // [Joshen] This is to ensure that hCaptcha popup remains clickable
            if (document !== undefined) document.body.classList.add('pointer-events-auto!')
          }}
          onClose={() => {
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
        <DialogHeader>
          <DialogTitle>Top Up Credits</DialogTitle>
          <DialogDescription className="space-y-2">
            <p className="prose text-sm">
              On successful payment, an invoice will be issued and you'll be granted credits equal
              to the pre-tax amount. Credits will be applied to future invoices only and are not
              refundable. The topped up credits do not expire.
            </p>
            <p className="prose text-sm">
              For larger discounted credit packages, please reach out to us via{' '}
              <SupportLink
                queryParams={{
                  orgSlug: slug,
                  projectRef: NO_PROJECT_MARKER,
                  subject: 'I would like to inquire about larger credit packages',
                  category: SupportCategories.SALES_ENQUIRY,
                }}
              >
                support
              </SupportLink>
              .
            </p>
          </DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <Form {...form}>
          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="flex flex-col gap-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItemLayout label="Amount (USD)" className="gap-1">
                    <Input_Shadcn_ {...field} type="number" placeholder="300" />
                  </FormItemLayout>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={() => (
                  <PaymentMethodSelection
                    ref={paymentMethodSelectionRef}
                    onSelectPaymentMethod={(pm) => form.setValue('paymentMethod', pm)}
                    selectedPaymentMethod={form.getValues('paymentMethod')}
                    readOnly={executingTopUp || paymentConfirmationLoading}
                    useAsDefaultBillingAddress={useAsDefaultBillingAddress}
                    onUseAsDefaultBillingAddressChange={setUseAsDefaultBillingAddress}
                    onAddressChange={handleAddressChange}
                    onTaxIdChange={handleTaxIdChange}
                  />
                )}
              />

              {paymentIntentConfirmation && paymentIntentConfirmation.error && (
                <Alert_Shadcn_ variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle_Shadcn_>Error confirming payment</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    {paymentIntentConfirmation.error.message}
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}

              {paymentIntentConfirmation?.paymentIntent &&
                paymentIntentConfirmation.paymentIntent.status === 'processing' && (
                  <Alert_Shadcn_ variant="default">
                    <Info className="h-4 w-4" />
                    <AlertTitle_Shadcn_>Payment processing</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      Your payment is processing and we are waiting for a confirmation from your
                      card issuer. If the payment goes through you'll automatically be credited.
                      Please check back later.
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}

              {errorInitiatingTopUp && (
                <Alert_Shadcn_ variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle_Shadcn_>Error topping up balance</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    {errorInitiatingTopUp.message}
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}

              {!!validAmount && !creditPreviewInitialized && creditPreviewIsFetching && (
                <div className="space-y-2 mt-4">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              )}

              {creditPreviewInitialized && !!validAmount && (
                <div className="mt-4">
                  <ChargeBreakdown
                    subtotal={creditPreview.amount}
                    total={creditPreview.total}
                    tax={
                      creditPreview.tax
                        ? {
                            amount: creditPreview.tax.tax_amount,
                            percentage: creditPreview.tax.tax_rate_percentage,
                          }
                        : undefined
                    }
                    taxStatus={creditPreview.tax_status}
                    isFetching={creditPreviewIsFetching}
                  />
                  {creditPreview.tax_status === 'calculated' &&
                    creditPreview.tax &&
                    creditPreview.tax.tax_amount > 0 && (
                      <p className="mt-2 text-xs text-foreground-muted">
                        You'll receive {formatCurrency(creditPreview.amount)} in credits.
                      </p>
                    )}
                </div>
              )}
            </DialogSection>

            {!paymentIntentConfirmation?.paymentIntent && (
              <DialogFooter>
                <Button
                  htmlType="submit"
                  type="primary"
                  loading={executingTopUp || paymentConfirmationLoading}
                  disabled={isPreviewStale || creditPreviewIsFetching}
                >
                  Top Up
                </Button>
              </DialogFooter>
            )}
          </form>
        </Form>
        {stripePromise && paymentIntentSecret && (
          <Elements stripe={stripePromise} options={options}>
            <PaymentConfirmation
              paymentIntentSecret={paymentIntentSecret}
              onPaymentIntentConfirm={(paymentIntentConfirmation) =>
                paymentIntentConfirmed(paymentIntentConfirmation)
              }
              onLoadingChange={(loading) => setPaymentConfirmationLoading(loading)}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  )
}
