import HCaptcha from '@hcaptcha/react-hcaptcha'
import { zodResolver } from '@hookform/resolvers/zod'
import { Elements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, PaymentIntentResult } from '@stripe/stripe-js'
import { PermissionAction, SupportCategories } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Info } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useOrganizationCreditTopUpMutation } from 'data/organizations/organization-credit-top-up-mutation'
import { subscriptionKeys } from 'data/subscriptions/keys'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { STRIPE_PUBLIC_KEY } from 'lib/constants'
import { useIsHCaptchaLoaded } from 'stores/hcaptcha-loaded-store'
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
  Form_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  LoadingLine,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import PaymentMethodSelection from './Subscription/PaymentMethodSelection'

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

const FORM_ID = 'credit-top-up'

const FormSchema = z.object({
  amount: z.coerce
    .number()
    .gte(100, 'Amount must be between $100 - $999.')
    .lte(999, 'Amount must be between $100 - $999.')
    .int('Amount must be a whole number.'),
  paymentMethod: z.string(),
})

type CreditTopUpForm = z.infer<typeof FormSchema>

export const CreditTopUp = ({ slug }: { slug: string | undefined }) => {
  const { resolvedTheme } = useTheme()
  const queryClient = useQueryClient()

  const canTopUpCredits = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )
  const isPermissionsLoaded = usePermissionsLoaded()

  const {
    mutateAsync: topUpCredits,
    isLoading: executingTopUp,
    error: errorInitiatingTopUp,
  } = useOrganizationCreditTopUpMutation({})

  const form = useForm<CreditTopUpForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      amount: 100,
      paymentMethod: '',
    },
  })

  const [topUpModalVisible, setTopUpModalVisible] = useState(false)
  const [paymentConfirmationLoading, setPaymentConfirmationLoading] = useState(false)
  const captchaLoaded = useIsHCaptchaLoaded()
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
    if (topUpModalVisible && captchaRef && captchaLoaded) {
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
  }, [topUpModalVisible, captchaRef, captchaLoaded])

  const [paymentIntentSecret, setPaymentIntentSecret] = useState('')
  const [paymentIntentConfirmation, setPaymentIntentConfirmation] = useState<PaymentIntentResult>()

  const onSubmit: SubmitHandler<CreditTopUpForm> = async ({ amount, paymentMethod }) => {
    setPaymentIntentConfirmation(undefined)

    const token = await initHcaptcha()

    await topUpCredits(
      {
        slug,
        amount,
        payment_method_id: paymentMethod,
        hcaptchaToken: token,
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
      appearance: { theme: resolvedTheme?.includes('dark') ? 'night' : 'flat', labels: 'floating' },
    } as any
  }, [paymentIntentSecret, resolvedTheme])

  const onTopUpDialogVisibilityChange = (visible: boolean) => {
    setTopUpModalVisible(visible)
    if (!visible) {
      setCaptchaRef(null)
      setPaymentIntentConfirmation(undefined)
      setPaymentIntentSecret('')
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
    await queryClient.invalidateQueries(subscriptionKeys.orgSubscription(slug))
    toast.success(
      'Successfully topped up balance. It may take a minute to reflect in your account.'
    )
  }

  return (
    <div className="flex items-center justify-end py-4 px-8">
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
              if (document !== undefined) document.body.classList.add('!pointer-events-auto')
            }}
            onClose={() => {
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
          <DialogHeader>
            <DialogTitle>Top Up Credits</DialogTitle>
            <DialogDescription>
              On successful payment, an invoice will be issued and you'll be granted credits.
              Credits will be applied to future invoices only and are not refundable. The topped up
              credits do not expire.
            </DialogDescription>
          </DialogHeader>

          <DialogSectionSeparator />

          <Form_Shadcn_ {...form}>
            <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
              <DialogSection className="flex flex-col gap-2">
                <FormField_Shadcn_
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItemLayout label="Amount (USD)" className="gap-1">
                      <Input_Shadcn_ {...field} type="number" placeholder="100" />
                    </FormItemLayout>
                  )}
                />

                <FormField_Shadcn_
                  control={form.control}
                  name="paymentMethod"
                  render={() => (
                    <PaymentMethodSelection
                      onSelectPaymentMethod={(pm) => form.setValue('paymentMethod', pm)}
                      selectedPaymentMethod={form.getValues('paymentMethod')}
                    />
                  )}
                />

                <p className="prose text-sm">
                  For larger discounted credit packages, please{' '}
                  <Link
                    href={`/support/new?slug=${slug}&subject=${encodeURIComponent('I would like to inquire about larger credit packages')}&category=${SupportCategories.BILLING}`}
                    target="_blank"
                  >
                    reach out.
                  </Link>
                </p>

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
              </DialogSection>

              {!paymentIntentConfirmation?.paymentIntent && (
                <DialogFooter>
                  <Button
                    htmlType="submit"
                    type="primary"
                    loading={executingTopUp || paymentConfirmationLoading}
                  >
                    Top Up
                  </Button>
                </DialogFooter>
              )}
            </form>
          </Form_Shadcn_>
          {stripePromise && paymentIntentSecret && (
            <Elements stripe={stripePromise} options={options}>
              <PaymentConfirmation
                paymentIntentSecret={paymentIntentSecret}
                onPaymentIntentConfirm={(paymentIntentConfirmation) =>
                  paymentIntentConfirmed(paymentIntentConfirmation)
                }
                onLoadingChange={(loading) => setPaymentConfirmationLoading(loading)}
                paymentMethodId={form.getValues().paymentMethod}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

const PaymentConfirmation = ({
  paymentIntentSecret,
  onPaymentIntentConfirm,
  onLoadingChange,
  paymentMethodId,
}: {
  paymentIntentSecret: string
  paymentMethodId: string
  onPaymentIntentConfirm: (response: PaymentIntentResult) => void
  onLoadingChange: (loading: boolean) => void
}) => {
  const stripe = useStripe()

  useEffect(() => {
    if (stripe && paymentIntentSecret) {
      onLoadingChange(true)
      stripe!
        .confirmCardPayment(paymentIntentSecret, { payment_method: paymentMethodId })
        .then((res) => {
          onPaymentIntentConfirm(res)
          onLoadingChange(false)
        })
        .catch((err) => {
          onLoadingChange(false)
        })
    }
  }, [paymentIntentSecret, stripe])

  return <LoadingLine loading={true} />
}
