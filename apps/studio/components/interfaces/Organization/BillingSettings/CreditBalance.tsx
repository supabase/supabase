import { PermissionAction, SupportCategories } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
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
import { useOrgSubscriptionQuery } from '../../../../data/subscriptions/org-subscription-query'
import { loadStripe, PaymentIntentResult } from '@stripe/stripe-js'
import { STRIPE_PUBLIC_KEY } from 'lib/constants'
import { Elements, useStripe } from '@stripe/react-stripe-js'
import { useTheme } from 'next-themes'
import PaymentMethodSelection from './Subscription/PaymentMethodSelection'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useOrganizationCreditTopUpMutation } from 'data/organizations/organization-credit-top-up-mutation'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent } from 'components/ui/Forms/FormSection'
import { useFlag } from 'hooks/ui/useFlag'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { subscriptionKeys } from 'data/subscriptions/keys'

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

const CreditBalance = () => {
  const { slug } = useParams()
  const { resolvedTheme } = useTheme()
  const queryClient = useQueryClient()

  const creditTopUpEnabled = useFlag('creditTopUp')
  const canTopUpCredits = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )
  const isPermissionsLoaded = usePermissionsLoaded()

  const canReadSubscriptions = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  const { mutate: topUpCredits, isLoading: executingTopUp } = useOrganizationCreditTopUpMutation({})

  const form = useForm<CreditTopUpForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      amount: 100,
      paymentMethod: '',
    },
  })

  const [topUpModalVisible, setTopUpModalVisible] = useState(false)
  const [paymentConfirmationLoading, setPaymentConfirmationLoading] = useState(false)

  const [paymentIntentSecret, setPaymentIntentSecret] = useState('')
  const [paymentIntentConfirmation, setPaymentIntentConfirmation] = useState<PaymentIntentResult>()

  const onSubmit: SubmitHandler<CreditTopUpForm> = async ({ amount, paymentMethod }) => {
    setPaymentIntentConfirmation(undefined)
    const res = await topUpCredits(
      {
        slug,
        amount,
        payment_method_id: paymentMethod,
      },
      {
        onSuccess: (data) => {
          if (data.status === 'succeeded') {
            onSuccessfulPayment()
          } else {
            setPaymentIntentSecret(data.payment_intent_secret || '')
          }
        },
        onError: (err) => console.error(err),
      }
    )
  }

  const {
    data: subscription,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useOrgSubscriptionQuery({ orgSlug: slug }, { enabled: canReadSubscriptions })

  const customerBalance = (subscription?.customer_balance ?? 0) / 100
  const isCredit = customerBalance < 0
  const isDebt = customerBalance > 0
  const balance =
    isCredit && customerBalance !== 0
      ? customerBalance.toFixed(2).toString().replace('-', '')
      : customerBalance.toFixed(2)

  const options = useMemo(() => {
    return {
      clientSecret: paymentIntentSecret,
      appearance: { theme: resolvedTheme?.includes('dark') ? 'night' : 'flat', labels: 'floating' },
    } as any
  }, [paymentIntentSecret, resolvedTheme])

  const paymentIntentConfirmed = (paymentIntentConfirmation: PaymentIntentResult) => {
    // Reset payment intent secret to ensure another attempt works as expected
    setPaymentIntentSecret('')
    setPaymentIntentConfirmation(paymentIntentConfirmation)

    if (paymentIntentConfirmation.paymentIntent?.status === 'succeeded') {
      onSuccessfulPayment()
    }
  }

  const onSuccessfulPayment = async () => {
    setTopUpModalVisible(false)
    setPaymentIntentConfirmation(undefined)
    await queryClient.invalidateQueries(subscriptionKeys.orgSubscription(slug))
    toast.success(
      'Successfully topped up balance. It may take a minute to reflect in your account.'
    )
  }

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        <div className="sticky space-y-2 top-12 pr-3">
          <div className="flex items-center space-x-2">
            <p className="text-foreground text-base m-0">Credit Balance</p>
          </div>
          <p className="text-sm text-foreground-light m-0">
            Credits will be applied to future invoices, before charging your payment method.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {!canReadSubscriptions ? (
          <NoPermission resourceText="view this organization's credits" />
        ) : (
          <>
            <FormPanel
              footer={
                creditTopUpEnabled ? (
                  <div className="flex items-center justify-end py-4 px-8">
                    <Dialog
                      open={topUpModalVisible}
                      onOpenChange={(open) => setTopUpModalVisible(open)}
                    >
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
                        <DialogHeader>
                          <DialogTitle>Top Up Credits</DialogTitle>
                          <DialogDescription>
                            On successful payment, an invoice will be issued and you'll be granted{' '}
                            credits. Credits will be applied to future invoices only and are not
                            refundable. The topped up credits do not expire.
                          </DialogDescription>
                        </DialogHeader>

                        <DialogSectionSeparator />

                        <Form_Shadcn_ {...form}>
                          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
                            <DialogSection className="flex flex-col gap-2">
                              <FormField_Shadcn_
                                control={form.control}
                                name="amount"
                                render={({ field: { ref, ...rest } }) => (
                                  <FormItemLayout label="Amount (USD)" className="gap-1">
                                    <Input_Shadcn_ {...rest} type="number" placeholder="100" />
                                  </FormItemLayout>
                                )}
                              />

                              <FormField_Shadcn_
                                control={form.control}
                                name="paymentMethod"
                                render={() => (
                                  <PaymentMethodSelection
                                    onSelectPaymentMethod={(pm) =>
                                      form.setValue('paymentMethod', pm)
                                    }
                                    selectedPaymentMethod={form.getValues('paymentMethod')}
                                  />
                                )}
                              />

                              <p className="prose text-sm">
                                If you are interested in larger discounted credit packages, please{' '}
                                <Link
                                  href={`/support/new?slug=${slug}&ref=no-project&message=${encodeURIComponent('I would like to inquire about larger credit packages')}&category=${SupportCategories.BILLING}`}
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
                            />
                          </Elements>
                        )}

                        {paymentIntentConfirmation && paymentIntentConfirmation.paymentIntent && (
                          <div className="text-sm prose">
                            {paymentIntentConfirmation.paymentIntent.status === 'processing' && (
                              <p>
                                Your payment is processing and we are waiting for a confirmation
                                from your card issuer. If the payment goes through you'll
                                automatically be credited. Please check back later.
                              </p>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : null
              }
            >
              <FormSection>
                <FormSectionContent fullWidth loading={isLoading}>
                  {isError && (
                    <AlertError
                      subject="Failed to retrieve organization customer profile"
                      error={error}
                    />
                  )}

                  {isSuccess && (
                    <div className="flex w-full justify-between items-center">
                      <span>Balance</span>
                      <div className="flex items-center space-x-1">
                        {isDebt && <h4 className="opacity-50">-</h4>}
                        <h4 className="opacity-50">$</h4>
                        <h2 className="text-2xl relative">{balance}</h2>
                        {isCredit && <h4 className="opacity-50">/credits</h4>}
                      </div>
                    </div>
                  )}
                </FormSectionContent>
              </FormSection>
            </FormPanel>
          </>
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default CreditBalance

const PaymentConfirmation = ({
  paymentIntentSecret,
  onPaymentIntentConfirm,
  onLoadingChange,
}: {
  paymentIntentSecret: string
  onPaymentIntentConfirm: (response: PaymentIntentResult) => void
  onLoadingChange: (loading: boolean) => void
}) => {
  const stripe = useStripe()

  useEffect(() => {
    if (stripe && paymentIntentSecret) {
      onLoadingChange(true)
      stripe!
        .confirmCardPayment(paymentIntentSecret)
        .then((res) => {
          onPaymentIntentConfirm(res)
          onLoadingChange(false)
        })
        .catch((err) => {
          console.error(err)
          onLoadingChange(false)
        })
    }
  }, [paymentIntentSecret, stripe])

  return <LoadingLine loading={true} />
}
