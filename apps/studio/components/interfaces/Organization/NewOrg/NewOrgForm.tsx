import { zodResolver } from '@hookform/resolvers/zod'
import { Elements } from '@stripe/react-stripe-js'
import type { PaymentIntentResult, PaymentMethod, StripeElementsOptions } from '@stripe/stripe-js'
import _ from 'lodash'
import { ExternalLink, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { loadStripe } from '@stripe/stripe-js'
import { Form_Shadcn_, FormControl_Shadcn_, FormField_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { LOCAL_STORAGE_KEYS } from 'common'
import { getStripeElementsAppearanceOptions } from 'components/interfaces/Billing/Payment/Payment.utils'
import { PaymentConfirmation } from 'components/interfaces/Billing/Payment/PaymentConfirmation'
import SpendCapModal from 'components/interfaces/Billing/SpendCapModal'
import { InlineLink } from 'components/ui/InlineLink'
import Panel from 'components/ui/Panel'
import { useOrganizationCreateMutation } from 'data/organizations/organization-create-mutation'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import type { CustomerAddress, CustomerTaxId } from 'data/organizations/types'
import { useProjectsInfiniteQuery } from 'data/projects/projects-infinite-query'
import { SetupIntentResponse } from 'data/stripe/setup-intent-mutation'
import { useConfirmPendingSubscriptionCreateMutation } from 'data/subscriptions/org-subscription-confirm-pending-create'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { PRICING_TIER_LABELS_ORG, STRIPE_PUBLIC_KEY } from 'lib/constants'
import { useProfile } from 'lib/profile'
import { useTheme } from 'next-themes'
import {
  Button,
  Input_Shadcn_,
  Label_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  NewPaymentMethodElement,
  type PaymentMethodElementRef,
} from '../../Billing/Payment/PaymentMethods/NewPaymentMethodElement'

const ORG_KIND_TYPES = {
  PERSONAL: 'Personal',
  EDUCATIONAL: 'Educational',
  STARTUP: 'Startup',
  AGENCY: 'Agency',
  COMPANY: 'Company',
  UNDISCLOSED: 'N/A',
}
const ORG_KIND_DEFAULT = 'PERSONAL'

const ORG_SIZE_TYPES = {
  '1': '1 - 10',
  '10': '10 - 49',
  '50': '50 - 99',
  '100': '100 - 299',
  '300': 'More than 300',
}
const ORG_SIZE_DEFAULT = '1'

interface NewOrgFormProps {
  onPaymentMethodReset: () => void
  setupIntent?: SetupIntentResponse
  onPlanSelected: (plan: string) => void
}

const plans = ['FREE', 'PRO', 'TEAM'] as const

const formSchema = z.object({
  plan: z
    .string()
    .transform((val) => val.toUpperCase())
    .pipe(z.enum(plans)),
  name: z.string().min(1, 'Organization name is required'),
  kind: z
    .string()
    .transform((val) => val.toUpperCase())
    .pipe(
      z.enum(['PERSONAL', 'EDUCATIONAL', 'STARTUP', 'AGENCY', 'COMPANY', 'UNDISCLOSED'] as const)
    ),
  size: z.enum(['1', '10', '50', '100', '300'] as const),
  spend_cap: z.boolean(),
})

type FormState = z.infer<typeof formSchema>

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

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
  const { resolvedTheme } = useTheme()

  const isBillingEnabled = useIsFeatureEnabled('billing:all')

  const { data: organizations, isSuccess } = useOrganizationsQuery()
  const { data } = useProjectsInfiniteQuery({})
  const projects = useMemo(() => data?.pages.flatMap((page) => page.projects) ?? [], [data?.pages])

  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const freeOrgs = (organizations || []).filter((it) => it.plan.id === 'free')

  // [Joshen] JFYI because we're now using a paginated endpoint, there's a chance that not all projects will be
  // factored in here (page limit is 100 results). This data is mainly used for the `hasFreeOrgWithProjects` check
  // in onSubmit below, which isn't a critical functionality imo so am okay for now. But ideally perhaps this data can
  // be computed on the API and returned in /profile or something (since this data is on the account level)
  const projectsByOrg = useMemo(() => {
    return _.groupBy(projects, 'organization_slug')
  }, [projects])

  const [isOrgCreationConfirmationModalVisible, setIsOrgCreationConfirmationModalVisible] =
    useState(false)

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
  })

  const form = useForm<FormState>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plan: 'FREE',
      name: '',
      kind: ORG_KIND_DEFAULT,
      size: ORG_SIZE_DEFAULT,
      spend_cap: true,
    },
  })

  useEffect(() => {
    if (!router.isReady) return

    const { name, kind, plan, size, spend_cap } = router.query

    if (typeof name === 'string') form.setValue('name', name)
    if (typeof kind === 'string') form.setValue('kind', kind)
    if (typeof plan === 'string' && plans.includes(plan.toUpperCase() as (typeof plans)[number])) {
      const uppercasedPlan = plan.toUpperCase() as (typeof plans)[number]
      form.setValue('plan', uppercasedPlan)
      onPlanSelected(uppercasedPlan)
    }
    if (typeof size === 'string') form.setValue('size', size as any)
    if (typeof spend_cap === 'string') form.setValue('spend_cap', spend_cap === 'true')
  }, [router.isReady, router.query, form, onPlanSelected])

  useEffect(() => {
    const currentName = form.getValues('name')
    if (!currentName && organizations?.length === 0 && !user.isLoading) {
      const prefilledOrgName = user.profile?.username ? user.profile.username + `'s Org` : 'My Org'
      form.setValue('name', prefilledOrgName)
    }
  }, [isSuccess, form, organizations?.length, user.isLoading, user.profile?.username])

  const [newOrgLoading, setNewOrgLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>()

  const [paymentConfirmationLoading, setPaymentConfirmationLoading] = useState(false)
  const [showSpendCapHelperModal, setShowSpendCapHelperModal] = useState(false)
  const [paymentIntentSecret, setPaymentIntentSecret] = useState<string | null>(null)

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
      resetPaymentMethod()
      setNewOrgLoading(false)
    },
  })

  const { mutate: confirmPendingSubscriptionChange } = useConfirmPendingSubscriptionCreateMutation({
    onSuccess: (data) => {
      if (data && 'slug' in data) {
        onOrganizationCreated({ slug: data.slug })
      }
    },
  })

  const paymentIntentConfirmed = async (paymentIntentConfirmation: PaymentIntentResult) => {
    // Reset payment intent secret to ensure another attempt works as expected
    setPaymentIntentSecret('')

    if (paymentIntentConfirmation.paymentIntent?.status === 'succeeded') {
      await confirmPendingSubscriptionChange({
        payment_intent_id: paymentIntentConfirmation.paymentIntent.id,
        name: formState.name,
        kind: formState.kind,
        size: formState.size,
      })
    } else {
      // If the payment intent is not successful, we reset the payment method and show an error
      toast.error(`Could not confirm payment. Please try again or use a different card.`, {
        duration: 10_000,
      })
      resetPaymentMethod()
      setNewOrgLoading(false)
    }
  }

  const onOrganizationCreated = (org: { slug: string }) => {
    const prefilledProjectName = user.profile?.username
      ? user.profile.username + `'s Project`
      : 'My Project'

    if (searchParams.returnTo && searchParams.auth_id) {
      router.push(`${searchParams.returnTo}?auth_id=${searchParams.auth_id}`, undefined, {
        shallow: false,
      })
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

  async function createOrg(
    paymentMethodId?: string,
    customerData?: {
      address: CustomerAddress | null
      billing_name: string | null
      tax_id: CustomerTaxId | null
    }
  ) {
    const formValues = form.getValues()
    const dbTier = formValues.plan === 'PRO' && !formValues.spend_cap ? 'PAYG' : formValues.plan

    createOrganization({
      name: formValues.name,
      kind: formValues.kind,
      tier: ('tier_' + dbTier.toLowerCase()) as
        | 'tier_payg'
        | 'tier_pro'
        | 'tier_free'
        | 'tier_team',
      ...(formValues.kind == 'COMPANY' ? { size: formValues.size } : {}),
      payment_method: paymentMethodId,
      billing_name: dbTier === 'FREE' ? undefined : customerData?.billing_name,
      address: dbTier === 'FREE' ? null : customerData?.address,
      tax_id: dbTier === 'FREE' ? undefined : customerData?.tax_id ?? undefined,
    })
  }

  const paymentRef = useRef<PaymentMethodElementRef | null>(null)

  const handleSubmit = async () => {
    setNewOrgLoading(true)
    const formValues = form.getValues()

    if (formValues.plan === 'FREE') {
      await createOrg()
    } else if (!paymentMethod) {
      const result = await paymentRef.current?.createPaymentMethod()
      if (result) {
        setPaymentMethod(result.paymentMethod)
        const customerData = {
          address: result.address,
          billing_name: result.customerName,
          tax_id: result.taxId,
        }

        createOrg(result.paymentMethod.id, customerData)
      } else {
        setNewOrgLoading(false)
      }
    } else {
      createOrg(paymentMethod.id)
    }
  }

  const resetPaymentMethod = () => {
    setPaymentMethod(undefined)
    return onPaymentMethodReset()
  }

  const onSubmitWithOrgCreation = async () => {
    const formValues = form.getValues()
    const isOrgNameValid = formValues.name.trim().length > 0
    if (!isOrgNameValid) {
      return toast.error('Organization name is empty')
    }

    const hasFreeOrgWithProjects = freeOrgs.some((it) => projectsByOrg[it.slug]?.length > 0)

    if (hasFreeOrgWithProjects && formValues.plan !== 'FREE') {
      setIsOrgCreationConfirmationModalVisible(true)
    } else {
      await handleSubmit()
    }
  }

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onSubmitWithOrgCreation)}>
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
                type="default"
                disabled={newOrgLoading || paymentConfirmationLoading}
                onClick={() => {
                  if (!!lastVisitedOrganization) router.push(`/org/${lastVisitedOrganization}`)
                  else router.push('/organizations')
                }}
              >
                Cancel
              </Button>

              <Button
                htmlType="submit"
                type="primary"
                loading={newOrgLoading}
                disabled={newOrgLoading}
              >
                Create organization
              </Button>
            </div>
          }
          // Allow address dropdown in Stripe Elements to overflow the panel
          noHideOverflow
          // Prevent resulting rounded corners in footer being clipped by squared corners of bg
          footerClasses="rounded-b-md"
        >
          <div className="divide-y divide-border-muted">
            <Panel.Content>
              <FormField_Shadcn_
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout
                    label="Name"
                    layout="horizontal"
                    description="What's the name of your company or team? You can change this name later."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        autoFocus
                        type="text"
                        placeholder="Organization name"
                        {...field}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </Panel.Content>
            <Panel.Content>
              <FormField_Shadcn_
                control={form.control}
                name="kind"
                render={({ field }) => (
                  <FormItemLayout
                    label="Type"
                    layout="horizontal"
                    description="What best describes your organization?"
                  >
                    <FormControl_Shadcn_>
                      <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger_Shadcn_ className="w-full">
                          <SelectValue_Shadcn_ />
                        </SelectTrigger_Shadcn_>

                        <SelectContent_Shadcn_>
                          {Object.entries(ORG_KIND_TYPES).map(([k, v]) => (
                            <SelectItem_Shadcn_ key={k} value={k}>
                              {v}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </Panel.Content>

            {form.watch('kind') == 'COMPANY' && (
              <Panel.Content>
                <FormField_Shadcn_
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Company size"
                      layout="horizontal"
                      description="How many people are in your company?"
                    >
                      <FormControl_Shadcn_>
                        <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger_Shadcn_ className="w-full">
                            <SelectValue_Shadcn_ />
                          </SelectTrigger_Shadcn_>

                          <SelectContent_Shadcn_>
                            {Object.entries(ORG_SIZE_TYPES).map(([k, v]) => (
                              <SelectItem_Shadcn_ key={k} value={k}>
                                {v}
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </Panel.Content>
            )}

            {isBillingEnabled && (
              <Panel.Content>
                <FormField_Shadcn_
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Plan"
                      layout="horizontal"
                      description={
                        <>
                          Which plan fits your organization's needs best?{' '}
                          <InlineLink
                            href="https://supabase.com/pricing"
                            target="_blank"
                            rel="noreferrer"
                            className="text-inherit hover:text-foreground transition-colors"
                          >
                            Learn more
                          </InlineLink>
                          .
                        </>
                      }
                    >
                      <FormControl_Shadcn_>
                        <Select_Shadcn_
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value)
                            onPlanSelected(value)
                          }}
                        >
                          <SelectTrigger_Shadcn_ className="w-full">
                            <SelectValue_Shadcn_ />
                          </SelectTrigger_Shadcn_>

                          <SelectContent_Shadcn_>
                            {Object.entries(PRICING_TIER_LABELS_ORG).map(([k, v]) => (
                              <SelectItem_Shadcn_ key={k} value={k} translate="no">
                                {v}
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </Panel.Content>
            )}

            {form.watch('plan') === 'PRO' && (
              <>
                <Panel.Content className="border-b border-panel-border-interior-light dark:border-panel-border-interior-dark">
                  <FormField_Shadcn_
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
                        <FormControl_Shadcn_>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl_Shadcn_>
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
                  />
                </Elements>
              </Panel.Content>
            )}
          </div>
        </Panel>

        <ConfirmationModal
          size="large"
          loading={newOrgLoading}
          visible={isOrgCreationConfirmationModalVisible}
          title="Confirm organization creation"
          confirmLabel="Create new organization"
          onCancel={() => setIsOrgCreationConfirmationModalVisible(false)}
          onConfirm={async () => {
            await handleSubmit()
            setIsOrgCreationConfirmationModalVisible(false)
          }}
          variant={'warning'}
        >
          <p className="text-sm text-foreground-light">
            Supabase{' '}
            <InlineLink href="https://supabase.com/docs/guides/platform/billing-on-supabase">
              bills per organization
            </InlineLink>
            . If you want to upgrade your existing projects, upgrade your existing organization
            instead.
          </p>

          <ul className="mt-4 space-y-6">
            {freeOrgs
              .filter((it) => projectsByOrg[it.slug]?.length > 0)
              .map((org) => {
                const orgProjects = projectsByOrg[org.slug].map((it) => it.name)

                return (
                  <li key={`org_${org.slug}`}>
                    <div className="flex justify-between text-sm">
                      <span>{org.name}</span>
                      <Button asChild type="primary" size="tiny">
                        <Link href={`/org/${org.slug}/billing?panel=subscriptionPlan`}>
                          Change Plan
                        </Link>
                      </Button>
                    </div>
                    <div className="text-foreground-light text-xs">
                      {orgProjects.length <= 2 ? (
                        <span>{orgProjects.join(' and ')}</span>
                      ) : (
                        <div>
                          {orgProjects.slice(0, 2).join(', ')} and{' '}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="underline decoration-dotted">
                                {orgProjects.length - 2} other{' '}
                                {orgProjects.length === 3 ? 'project' : 'project'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <ul className="list-disc list-inside">
                                {orgProjects.slice(2).map((project) => (
                                  <li>{project}</li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
          </ul>
        </ConfirmationModal>

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
                setNewOrgLoading(false)
                resetPaymentMethod()
              }}
            />
          </Elements>
        )}
      </form>
    </Form_Shadcn_>
  )
}
