import { zodResolver } from '@hookform/resolvers/zod'
import { Elements } from '@stripe/react-stripe-js'
import type { PaymentIntentResult, PaymentMethod, StripeElementsOptions } from '@stripe/stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useDebounce } from '@uidotdev/usehooks'
import { groupBy } from 'lodash'
import { HelpCircle } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/router'
import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Form,
  FormControl,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { z } from 'zod'

import {
  ORG_KIND_DEFAULT,
  ORG_SIZE_DEFAULT,
  OrganizationDetailsFields,
  organizationDetailsSchema,
  type OrgKind,
  type OrgSize,
} from './OrganizationDetailsFields'
import { UpgradeExistingOrganizationCallout } from './UpgradeExistingOrganizationCallout'
import { ChargeBreakdown } from '@/components/interfaces/Billing/ChargeBreakdown'
import { getStripeElementsAppearanceOptions } from '@/components/interfaces/Billing/Payment/Payment.utils'
import { PaymentConfirmation } from '@/components/interfaces/Billing/Payment/PaymentConfirmation'
import {
  NewPaymentMethodElement,
  type PaymentMethodElementRef,
} from '@/components/interfaces/Billing/Payment/PaymentMethods/NewPaymentMethodElement'
import SpendCapModal from '@/components/interfaces/Billing/SpendCapModal'
import { InlineLink } from '@/components/ui/InlineLink'
import Panel from '@/components/ui/Panel'
import { useOrganizationCreateMutation } from '@/data/organizations/organization-create-mutation'
import { useOrganizationCreationPreview } from '@/data/organizations/organization-creation-preview'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import type { CustomerAddress, CustomerTaxId } from '@/data/organizations/types'
import { useProjectsInfiniteQuery } from '@/data/projects/projects-infinite-query'
import { SetupIntentResponse } from '@/data/stripe/setup-intent-mutation'
import { useConfirmPendingSubscriptionCreateMutation } from '@/data/subscriptions/org-subscription-confirm-pending-create'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'
import { PRICING_TIER_LABELS_ORG, STRIPE_PUBLIC_KEY } from '@/lib/constants'
import { validateReturnTo } from '@/lib/gotrue'
import { useProfile } from '@/lib/profile'
import {
  classifyApiError,
  classifyStripeError,
  classifyValidationError,
} from '@/lib/telemetry/funnel-errors'
import { useTrack } from '@/lib/telemetry/track'
import { useTrackFunnelError } from '@/lib/telemetry/use-track-funnel-error'

interface NewOrgFormProps {
  onPaymentMethodReset: () => void
  setupIntent?: SetupIntentResponse
  onPlanSelected: (plan: string) => void
}

const plans = ['FREE', 'PRO', 'TEAM'] as const

const formSchema = organizationDetailsSchema.extend({
  plan: z
    .string()
    .transform((val) => val.toUpperCase())
    .pipe(z.enum(plans)),
  spend_cap: z.boolean(),
})

type FormState = z.infer<typeof formSchema>

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

const FORM_ID = 'new-org-form'

/**
 * No org selected yet, create a new one
 * [Joshen] Need to refactor to use Form_Shadcn here
 */
export const NewOrgForm = ({
  onPaymentMethodReset,
  setupIntent,
  onPlanSelected,
}: NewOrgFormProps) => {
  const router = useRouter()
  const user = useProfile()
  const track = useTrack()
  const { resolvedTheme } = useTheme()
  const { lastVisitedOrganization } = useLastVisitedOrganization()

  const isBillingEnabled = useIsFeatureEnabled('billing:all')

  const { data: organizations, isSuccess } = useOrganizationsQuery()
  const { data } = useProjectsInfiniteQuery({})
  const projects = useMemo(() => data?.pages.flatMap((page) => page.projects) ?? [], [data?.pages])

  const freeOrgs = (organizations || []).filter((it) => it.plan.id === 'free')

  // [Joshen] JFYI because we're now using a paginated endpoint, there's a chance that not all projects will be
  // factored in here (page limit is 100 results). This data is mainly used for the `hasFreeOrgWithProjects` check
  // in onSubmit below, which isn't a critical functionality imo so am okay for now. But ideally perhaps this data can
  // be computed on the API and returned in /profile or something (since this data is on the account level)
  const projectsByOrg = useMemo(() => {
    return groupBy(projects, 'organization_slug')
  }, [projects])

  const stripeOptionsPaymentMethod: StripeElementsOptions = useMemo(
    () =>
      ({
        clientSecret: setupIntent ? setupIntent.client_secret! : '',
        appearance: getStripeElementsAppearanceOptions(resolvedTheme),
        paymentMethodCreation: 'manual',
      }) as const,
    [setupIntent, resolvedTheme]
  )

  const [searchParams] = useQueryStates({
    returnTo: parseAsString.withDefault(''),
    auth_id: parseAsString.withDefault(''),
    token: parseAsString.withDefault(''),
  })

  const [defaultValues] = useQueryStates({
    name: parseAsString.withDefault(''),
    kind: parseAsString.withDefault(ORG_KIND_DEFAULT),
    plan: parseAsString.withDefault('FREE'),
    size: parseAsString.withDefault(ORG_SIZE_DEFAULT),
    spend_cap: parseAsBoolean.withDefault(true),
  })

  const form = useForm<FormState>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plan: defaultValues.plan.toUpperCase() as (typeof plans)[number],
      name: defaultValues.name,
      kind: defaultValues.kind as OrgKind,
      size: defaultValues.size as OrgSize,
      spend_cap: defaultValues.spend_cap,
    },
  })

  useEffect(() => {
    form.reset({
      plan: defaultValues.plan.toUpperCase() as (typeof plans)[number],
      name: defaultValues.name,
      kind: defaultValues.kind as OrgKind,
      size: defaultValues.size as OrgSize,
      spend_cap: defaultValues.spend_cap,
    })
  }, [defaultValues, form])

  useEffect(() => {
    const currentName = form.getValues('name')
    if (!currentName && isSuccess && organizations?.length === 0 && user.isSuccess) {
      const prefilledOrgName = user.profile?.username ? user.profile.username + `'s Org` : 'My Org'
      form.setValue('name', prefilledOrgName)
    }
  }, [isSuccess, form, organizations?.length, user.profile?.username, user.isSuccess])

  const hasTrackedFormExposed = useRef(false)
  useEffect(() => {
    if (hasTrackedFormExposed.current) return
    if (!user.isSuccess) return
    hasTrackedFormExposed.current = true
    track('organization_creation_form_exposed')
  }, [user.isSuccess, track])

  const [latestAddress, setLatestAddress] = useState<CustomerAddress>()
  const [latestTaxId, setLatestTaxId] = useState<CustomerTaxId | null>()

  const billingAddress = useDebounce(latestAddress, 1000)
  const billingTaxId = useDebounce(latestTaxId, 1000)

  const handleAddressChange = useCallback((address: CustomerAddress) => {
    setLatestAddress({
      ...address,
      line2: address.line2 || undefined,
    })
  }, [])

  const handleAddressIncomplete = useCallback(() => {
    setLatestAddress(undefined)
  }, [])

  const handleTaxIdChange = useCallback((taxId: CustomerTaxId | null) => {
    setLatestTaxId(taxId)
  }, [])

  const selectedPlan = form.watch('plan')
  const selectedSpendCap = form.watch('spend_cap')

  useEffect(() => {
    if (selectedPlan === 'FREE' || !setupIntent) {
      setLatestAddress(undefined)
      setLatestTaxId(null)
    }
  }, [selectedPlan, setupIntent])

  const previewTier = useMemo(() => {
    if (selectedPlan === 'FREE') return undefined
    const dbTier = selectedPlan === 'PRO' && !selectedSpendCap ? 'PAYG' : selectedPlan
    return ('tier_' + dbTier.toLowerCase()) as 'tier_pro' | 'tier_payg' | 'tier_team'
  }, [selectedPlan, selectedSpendCap])

  const {
    data: creationPreview,
    isFetching: creationPreviewIsFetching,
    isSuccess: creationPreviewInitialized,
  } = useOrganizationCreationPreview(
    {
      tier: previewTier,
      address: billingAddress,
      taxId: billingTaxId ?? undefined,
    },
    { enabled: !!previewTier && !!billingAddress }
  )

  const [newOrgLoading, setNewOrgLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>()

  const [paymentConfirmationLoading, setPaymentConfirmationLoading] = useState(false)
  const [showSpendCapHelperModal, setShowSpendCapHelperModal] = useState(false)
  const [paymentIntentSecret, setPaymentIntentSecret] = useState<string | null>(null)

  const hasFreeOrgWithProjects = useMemo(
    () => freeOrgs.some((it) => projectsByOrg[it.slug]?.length > 0),
    [freeOrgs, projectsByOrg]
  )

  const trackFunnelError = useTrackFunnelError()

  const { mutate: createOrganization } = useOrganizationCreateMutation({
    onSuccess: async (org) => {
      if ('pending_payment_intent_secret' in org && org.pending_payment_intent_secret) {
        setPaymentIntentSecret(org.pending_payment_intent_secret)
      } else {
        onOrganizationCreated(org as { slug: string })
      }
    },
    onError: (data) => {
      toast.error(data.message, { duration: 10_000 })
      trackFunnelError('org_creation', classifyApiError('org_creation', data), 'toast')
      setNewOrgLoading(false)
    },
  })

  const { mutate: confirmPendingSubscriptionChange } = useConfirmPendingSubscriptionCreateMutation({
    onSuccess: (data) => {
      if (data && 'slug' in data) {
        onOrganizationCreated({ slug: data.slug })
      }
    },
    onError: (error) => {
      toast.error(error.message, { dismissible: true, duration: 10_000 })
      trackFunnelError('org_creation', classifyApiError('org_creation', error), 'toast')
    },
  })

  const paymentIntentConfirmed = async (paymentIntentConfirmation: PaymentIntentResult) => {
    // Reset payment intent secret to ensure another attempt works as expected
    setPaymentIntentSecret('')

    if (paymentIntentConfirmation.paymentIntent?.status === 'succeeded') {
      await confirmPendingSubscriptionChange({
        payment_intent_id: paymentIntentConfirmation.paymentIntent.id,
        name: form.getValues('name'),
        kind: form.getValues('kind'),
        size: form.getValues('size'),
      })
    } else {
      trackFunnelError(
        'org_creation',
        classifyStripeError(paymentIntentConfirmation.error),
        'toast'
      )
      // If the payment intent is not successful, we reset the payment method and show an error
      toast.error(`Could not confirm payment. Please try again or use a different card.`, {
        duration: 10_000,
      })
      resetPaymentMethod()
      setNewOrgLoading(false)
    }
  }

  const onOrganizationCreated = (org: { slug: string }) => {
    if (submittedTier.current) {
      track(
        'organization_creation_completed',
        { tier: submittedTier.current },
        { organization: org.slug }
      )
    }

    const prefilledProjectName = user.profile?.username
      ? user.profile.username + `'s Project`
      : 'My Project'

    if (searchParams.returnTo) {
      const url = new URL(validateReturnTo(searchParams.returnTo, '/'), window.location.origin)
      if (searchParams.auth_id) {
        url.searchParams.set('auth_id', searchParams.auth_id)
      }
      if (searchParams.token) {
        url.searchParams.set('token', searchParams.token)
      }

      router.push(url.toString(), undefined, { shallow: false })
    } else {
      router.push(`/new/${org.slug}?projectName=${prefilledProjectName}`)
    }
  }

  const stripeOptionsConfirm = useMemo(() => {
    return {
      clientSecret: paymentIntentSecret,
      appearance: getStripeElementsAppearanceOptions(resolvedTheme),
    } as StripeElementsOptions
  }, [paymentIntentSecret, resolvedTheme])

  const submittedTier = useRef<'tier_free' | 'tier_pro' | 'tier_payg' | 'tier_team' | null>(null)

  async function createOrg(
    formValues: z.infer<typeof formSchema>,
    paymentMethodId?: string,
    customerData?: {
      address: CustomerAddress | null
      billing_name: string | null
      tax_id: CustomerTaxId | null
    }
  ) {
    const dbTier = formValues.plan === 'PRO' && !formValues.spend_cap ? 'PAYG' : formValues.plan
    const tier = ('tier_' + dbTier.toLowerCase()) as
      | 'tier_payg'
      | 'tier_pro'
      | 'tier_free'
      | 'tier_team'
    submittedTier.current = tier

    createOrganization({
      name: formValues.name,
      kind: formValues.kind,
      tier,
      ...(formValues.kind == 'COMPANY' ? { size: formValues.size } : {}),
      payment_method: paymentMethodId,
      billing_name: dbTier === 'FREE' ? undefined : customerData?.billing_name,
      address: dbTier === 'FREE' ? null : customerData?.address,
      tax_id: dbTier === 'FREE' ? undefined : (customerData?.tax_id ?? undefined),
    })
  }

  const paymentRef = useRef<PaymentMethodElementRef | null>(null)

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (formValues) => {
    setNewOrgLoading(true)

    if (formValues.plan === 'FREE') {
      await createOrg(formValues)
      return
    }

    const result = await paymentRef.current?.createPaymentMethod()
    if (!result) {
      setNewOrgLoading(false)
      return
    }

    setPaymentMethod(result.paymentMethod)
    createOrg(formValues, result.paymentMethod.id, {
      address: result.address,
      billing_name: result.customerName,
      tax_id: result.taxId,
    })
  }

  const resetPaymentMethod = () => {
    setPaymentMethod(undefined)
    return onPaymentMethodReset()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) =>
          trackFunnelError('org_creation', classifyValidationError('org_creation', errors), 'form')
        )}
        id={FORM_ID}
      >
        <Panel
          title={
            <div key="panel-title">
              <h3>Create a new organization</h3>
              <p className="text-sm text-foreground-lighter text-balance">
                Organizations are a way to group your projects. Each organization can be configured
                with different team members and billing settings.
              </p>
            </div>
          }
          footer={
            <div key="panel-footer" className="flex w-full items-center justify-between">
              <Button
                variant="default"
                disabled={newOrgLoading || paymentConfirmationLoading}
                onClick={() => {
                  if (!!lastVisitedOrganization) router.push(`/org/${lastVisitedOrganization}`)
                  else router.push('/organizations')
                }}
              >
                Cancel
              </Button>

              <Button
                form={FORM_ID}
                type="submit"
                variant="primary"
                loading={newOrgLoading}
                disabled={newOrgLoading || creationPreviewIsFetching}
              >
                Create organization
              </Button>
            </div>
          }
          // Allow address dropdown in Stripe Elements to overflow the panel
          noHideOverflow
          // Prevent resulting rounded corners in footer being clipped by squared corners of bg
          titleClasses="rounded-t-md"
          footerClasses="rounded-b-md"
        >
          <div className="divide-y divide-border-muted">
            <OrganizationDetailsFields
              control={form.control}
              kind={form.watch('kind')}
              renderFieldWrapper={(children, field) => (
                <Panel.Content key={field}>{children}</Panel.Content>
              )}
            />

            {isBillingEnabled && (
              <Panel.Content>
                <FormField
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Plan"
                      layout="horizontal"
                      description={
                        <>
                          Which plan fits your organization's needs best?{' '}
                          <InlineLink href="https://supabase.com/pricing">Learn more</InlineLink>.
                        </>
                      }
                    >
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value)
                            onPlanSelected(value)
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            {Object.entries(PRICING_TIER_LABELS_ORG).map(([k, v]) => (
                              <SelectItem key={k} value={k} translate="no">
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </Panel.Content>
            )}

            {form.watch('plan') === 'PRO' && (
              <>
                <Panel.Content className="border-b border-panel-border-interior-light dark:border-panel-border-interior-dark">
                  <FormField
                    control={form.control}
                    name="spend_cap"
                    render={({ field }) => (
                      <FormItemLayout
                        label={
                          <div className="flex space-x-2 text-sm items-center">
                            <span>Spend Cap</span>
                            <HelpCircle
                              size={16}
                              strokeWidth={1.5}
                              className="transition opacity-50 cursor-pointer hover:opacity-100"
                              onClick={() => setShowSpendCapHelperModal(true)}
                            />
                          </div>
                        }
                        layout="horizontal"
                        description={
                          field.value
                            ? `Usage is limited to the plan's quota.`
                            : `You pay for overages beyond the plan's quota.`
                        }
                      >
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </Panel.Content>

                <SpendCapModal
                  visible={showSpendCapHelperModal}
                  onHide={() => setShowSpendCapHelperModal(false)}
                />
              </>
            )}

            {setupIntent && form.watch('plan') !== 'FREE' && (
              <Panel.Content className="pt-5">
                <Elements stripe={stripePromise} options={stripeOptionsPaymentMethod}>
                  <NewPaymentMethodElement
                    ref={paymentRef}
                    email={user.profile?.primary_email}
                    readOnly={newOrgLoading || paymentConfirmationLoading}
                    onAddressChange={handleAddressChange}
                    onAddressIncomplete={handleAddressIncomplete}
                    onTaxIdChange={handleTaxIdChange}
                  />
                </Elements>

                {!!billingAddress && !creationPreviewInitialized && (
                  <div className="space-y-2 mt-4">
                    <ShimmeringLoader />
                    <ShimmeringLoader className="w-3/4" />
                    <ShimmeringLoader className="w-1/2" />
                  </div>
                )}

                {creationPreviewInitialized && !!billingAddress && (
                  <div className="mt-4">
                    <ChargeBreakdown
                      subtotal={creationPreview.plan_price}
                      subtotalLabel="Plan price"
                      total={creationPreview.total}
                      tax={
                        creationPreview.tax
                          ? {
                              amount: creationPreview.tax.tax_amount,
                              percentage: creationPreview.tax.tax_rate_percentage,
                            }
                          : undefined
                      }
                      taxStatus={creationPreview.tax_status}
                      isFetching={creationPreviewIsFetching}
                    />
                  </div>
                )}
              </Panel.Content>
            )}

            {hasFreeOrgWithProjects && form.getValues('plan') !== 'FREE' && (
              <UpgradeExistingOrganizationCallout />
            )}
          </div>
        </Panel>

        {stripePromise && paymentIntentSecret && paymentMethod && (
          <Elements stripe={stripePromise} options={stripeOptionsConfirm}>
            <PaymentConfirmation
              paymentIntentSecret={paymentIntentSecret}
              onPaymentIntentConfirm={(paymentIntentConfirmation) =>
                paymentIntentConfirmed(paymentIntentConfirmation)
              }
              onLoadingChange={(loading) => setPaymentConfirmationLoading(loading)}
              onError={(err) => {
                toast.error(err.message, { duration: 10_000 })
                trackFunnelError(
                  'org_creation',
                  { errorCategory: 'payment', errorReason: 'payment_error' },
                  'toast'
                )
                setNewOrgLoading(false)
                resetPaymentMethod()
              }}
            />
          </Elements>
        )}
      </form>
    </Form>
  )
}
