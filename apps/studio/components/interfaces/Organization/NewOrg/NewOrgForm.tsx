import { Elements } from '@stripe/react-stripe-js'
import type { PaymentIntentResult, PaymentMethod, StripeElementsOptions } from '@stripe/stripe-js'
import _ from 'lodash'
import { ExternalLink, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { LOCAL_STORAGE_KEYS } from 'common'
import SpendCapModal from 'components/interfaces/Billing/SpendCapModal'
import Panel from 'components/ui/Panel'
import { useOrganizationCreateMutation } from 'data/organizations/organization-create-mutation'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { PRICING_TIER_LABELS_ORG, STRIPE_PUBLIC_KEY } from 'lib/constants'
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
import { useConfirmPendingSubscriptionCreateMutation } from 'data/subscriptions/org-subscription-confirm-pending-create'
import { loadStripe } from '@stripe/stripe-js'
import { useTheme } from 'next-themes'
import { SetupIntentResponse } from 'data/stripe/setup-intent-mutation'
import { useProfile } from 'lib/profile'
import { PaymentConfirmation } from 'components/interfaces/Billing/Payment/PaymentConfirmation'
import { getStripeElementsAppearanceOptions } from 'components/interfaces/Billing/Payment/Payment.utils'
import {
  NewPaymentMethodElement,
  type PaymentMethodElementRef,
} from '../BillingSettings/PaymentMethods/NewPaymentMethodElement'
import { components } from 'api-types'
import type { CustomerAddress, CustomerTaxId } from 'data/organizations/types'

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
  name: z.string().min(1),
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

const newMandatoryAddressInput = true

/**
 * No org selected yet, create a new one
 * [Joshen] Need to refactor to use Form_Shadcn here
 */
const NewOrgForm = ({ onPaymentMethodReset, setupIntent, onPlanSelected }: NewOrgFormProps) => {
  const router = useRouter()
  const user = useProfile()
  const { data: organizations, isSuccess } = useOrganizationsQuery()
  const { data: projects } = useProjectsQuery()
  const { resolvedTheme } = useTheme()

  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const freeOrgs = (organizations || []).filter((it) => it.plan.id === 'free')

  const projectsByOrg = useMemo(() => {
    return _.groupBy(projects || [], 'organization_slug')
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

  const [formState, setFormState] = useState<FormState>({
    plan: 'FREE',
    name: '',
    kind: ORG_KIND_DEFAULT,
    size: ORG_SIZE_DEFAULT,
    spend_cap: true,
  })

  const [searchParams] = useQueryStates({
    returnTo: parseAsString.withDefault(''),
    auth_id: parseAsString.withDefault(''),
  })

  const updateForm = (key: keyof FormState, value: unknown) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    if (!router.isReady) return

    const { name, kind, plan, size, spend_cap } = router.query

    if (typeof name === 'string') updateForm('name', name)
    if (typeof kind === 'string') updateForm('kind', kind)
    if (typeof plan === 'string' && plans.includes(plan.toUpperCase() as (typeof plans)[number])) {
      const uppercasedPlan = plan.toUpperCase() as (typeof plans)[number]
      updateForm('plan', uppercasedPlan)
      onPlanSelected(uppercasedPlan)
    }
    if (typeof size === 'string') updateForm('size', size)
    if (typeof spend_cap === 'string') updateForm('spend_cap', spend_cap === 'true')
  }, [router.isReady])

  useEffect(() => {
    if (!formState.name && organizations?.length === 0 && !user.isLoading) {
      const prefilledOrgName = user.profile?.username ? user.profile.username + `'s Org` : 'My Org'
      updateForm('name', prefilledOrgName)
    }
  }, [isSuccess])

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

  function validateOrgName(name: any) {
    const value = name ? name.trim() : ''
    return value.length >= 1
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
    const dbTier = formState.plan === 'PRO' && !formState.spend_cap ? 'PAYG' : formState.plan

    createOrganization({
      name: formState.name,
      kind: formState.kind,
      tier: ('tier_' + dbTier.toLowerCase()) as
        | 'tier_payg'
        | 'tier_pro'
        | 'tier_free'
        | 'tier_team',
      ...(formState.kind == 'COMPANY' ? { size: formState.size } : {}),
      payment_method: paymentMethodId,
      billing_name: dbTier === 'FREE' ? undefined : customerData?.billing_name,
      address: dbTier === 'FREE' ? null : customerData?.address,
      tax_id: dbTier === 'FREE' ? undefined : customerData?.tax_id ?? undefined,
    })
  }

  const paymentRef = useRef<PaymentMethodElementRef | null>(null)

  const handleSubmit = async () => {
    setNewOrgLoading(true)

    if (formState.plan === 'FREE') {
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

  const onSubmitWithOrgCreation = async (event: any) => {
    event.preventDefault()

    const isOrgNameValid = validateOrgName(formState.name)
    if (!isOrgNameValid) {
      return toast.error('Organization name is empty')
    }

    const hasFreeOrgWithProjects = freeOrgs.some((it) => projectsByOrg[it.slug]?.length > 0)

    if (hasFreeOrgWithProjects && formState.plan !== 'FREE') {
      setIsOrgCreationConfirmationModalVisible(true)
    } else {
      await handleSubmit()
    }
  }

  return (
    <form onSubmit={onSubmitWithOrgCreation}>
      <Panel
        title={
          <div key="panel-title">
            <h4>Create a new organization</h4>
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
            <div className="flex items-center space-x-3">
              <p className="text-xs text-foreground-lighter">
                You can rename your organization later
              </p>
              <Button
                htmlType="submit"
                type="primary"
                loading={newOrgLoading}
                disabled={newOrgLoading}
              >
                Create organization
              </Button>
            </div>
          </div>
        }
        className="overflow-visible"
      >
        <Panel.Content>
          <p className="text-sm">This is your organization within Supabase.</p>
          <p className="text-sm text-foreground-light">
            For example, you can use the name of your company or department.
          </p>
        </Panel.Content>
        <Panel.Content className="Form section-block--body has-inputs-centered">
          <div className="grid grid-cols-3 w-full">
            <div>
              <Label_Shadcn_ htmlFor="name">Name</Label_Shadcn_>
            </div>
            <div className="col-span-2">
              <Input_Shadcn_
                id="name"
                autoFocus
                type="text"
                placeholder="Organization name"
                value={formState.name}
                onChange={(e) => updateForm('name', e.target.value)}
              />
              <div className="mt-1">
                <Label_Shadcn_
                  htmlFor="name"
                  className="text-foreground-lighter leading-normal text-sm"
                >
                  What's the name of your company or team?
                </Label_Shadcn_>
              </div>
            </div>
          </div>
        </Panel.Content>
        <Panel.Content className="Form section-block--body has-inputs-centered">
          <div className="grid grid-cols-3">
            <div>
              <Label_Shadcn_ htmlFor="kind">Type</Label_Shadcn_>
            </div>
            <div className="col-span-2">
              <Select_Shadcn_
                value={formState.kind}
                onValueChange={(value) => updateForm('kind', value)}
              >
                <SelectTrigger_Shadcn_ id="kind" className="w-full">
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

              <div className="mt-1">
                <Label_Shadcn_
                  htmlFor="kind"
                  className="text-foreground-lighter leading-normal text-sm"
                >
                  What would best describe your organization?
                </Label_Shadcn_>
              </div>
            </div>
          </div>
        </Panel.Content>

        {formState.kind == 'COMPANY' && (
          <Panel.Content className="Form section-block--body has-inputs-centered">
            <div className="grid grid-cols-3">
              <div>
                <Label_Shadcn_ htmlFor="size">Company size</Label_Shadcn_>
              </div>
              <div className="col-span-2">
                <Select_Shadcn_
                  value={formState.size}
                  onValueChange={(value) => updateForm('size', value)}
                >
                  <SelectTrigger_Shadcn_ id="size" className="w-full">
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

                <div className="mt-2">
                  <Label_Shadcn_
                    htmlFor="size"
                    className="text-foreground-lighter leading-normal text-sm"
                  >
                    How many people are in your company?
                  </Label_Shadcn_>
                </div>
              </div>
            </div>
          </Panel.Content>
        )}

        <Panel.Content>
          <div className="grid grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label_Shadcn_ htmlFor="plan" className=" text-sm">
                Plan
              </Label_Shadcn_>

              <a
                href="https://supabase.com/pricing"
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm flex items-center gap-2 opacity-75 hover:opacity-100 transition"
              >
                Pricing
                <ExternalLink size={16} strokeWidth={1.5} />
              </a>
            </div>
            <div className="col-span-2">
              <Select_Shadcn_
                value={formState.plan}
                onValueChange={(value) => {
                  updateForm('plan', value)
                  onPlanSelected(value)
                }}
              >
                <SelectTrigger_Shadcn_ id="plan" className="w-full">
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

              <div className="mt-1">
                <Label_Shadcn_
                  htmlFor="plan"
                  className="text-foreground-lighter leading-normal text-sm"
                >
                  The Plan applies to your new organization.
                </Label_Shadcn_>
              </div>
            </div>
          </div>
        </Panel.Content>

        {formState.plan === 'PRO' && (
          <>
            <Panel.Content className="border-b border-panel-border-interior-light dark:border-panel-border-interior-dark">
              <div className="grid grid-cols-3">
                <div className="col-span-1 flex space-x-2 text-sm">
                  <Label_Shadcn_ htmlFor="spend-cap" className=" leading-normal">
                    Spend Cap
                  </Label_Shadcn_>

                  <HelpCircle
                    size={16}
                    strokeWidth={1.5}
                    className="transition opacity-50 cursor-pointer hover:opacity-100"
                    onClick={() => setShowSpendCapHelperModal(true)}
                  />
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <Switch
                    id="spend-cap"
                    checked={formState.spend_cap}
                    onCheckedChange={() => updateForm('spend_cap', !formState.spend_cap)}
                  />
                  <Label_Shadcn_ htmlFor="spend-cap">
                    {formState.spend_cap
                      ? `Usage is limited to the plan's quota.`
                      : `You pay for overages beyond the plan's quota.`}
                  </Label_Shadcn_>
                </div>
              </div>
            </Panel.Content>

            <SpendCapModal
              visible={showSpendCapHelperModal}
              onHide={() => setShowSpendCapHelperModal(false)}
            />
          </>
        )}

        {setupIntent && formState.plan !== 'FREE' && (
          <Panel.Content>
            <Elements stripe={stripePromise} options={stripeOptionsPaymentMethod}>
              <Panel.Content>
                <NewPaymentMethodElement
                  ref={paymentRef}
                  email={user.profile?.primary_email}
                  readOnly={newOrgLoading || paymentConfirmationLoading}
                />
              </Panel.Content>
            </Elements>
          </Panel.Content>
        )}
      </Panel>

      <ConfirmationModal
        size="large"
        loading={false}
        visible={isOrgCreationConfirmationModalVisible}
        title={<>Confirm organization creation</>}
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
          <Link
            className="underline"
            href="/docs/guides/platform/billing-on-supabase"
            target="_blank"
          >
            bills per organization
          </Link>
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
                      <span>{orgProjects.join('and ')}</span>
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
  )
}

export default NewOrgForm
