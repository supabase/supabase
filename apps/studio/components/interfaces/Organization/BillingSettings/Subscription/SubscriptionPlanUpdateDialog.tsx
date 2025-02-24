import { useQueryClient } from '@tanstack/react-query'
import { InfoIcon, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import tweets from 'shared-data/tweets'

import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Card,
  CardContent,
  Badge,
} from 'ui'
import { useOrgSubscriptionUpdateMutation } from 'data/subscriptions/org-subscription-update-mutation'
import { organizationKeys } from 'data/organizations/keys'
import { formatCurrency } from 'lib/helpers'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { SubscriptionTier } from 'data/subscriptions/types'
import { billingPartnerLabel } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import PaymentMethodSelection from './PaymentMethodSelection'
import { Button, Dialog, DialogContent } from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { OrganizationBillingSubscriptionPreviewResponse } from 'data/organizations/organization-billing-subscription-preview'

const getRandomTweet = () => {
  const randomIndex = Math.floor(Math.random() * tweets.length)
  return tweets[randomIndex]
}

const PLAN_HEADINGS = {
  tier_pro:
    'the Pro plan and create unlimited projects, daily backups and premium support when you need it',
  tier_team: 'the Team plan for SOC2, SSO, priority support and greater data and log retention',
  default: 'to a new plan',
} as const

type PlanHeadingKey = keyof typeof PLAN_HEADINGS

interface Props {
  selectedTier: 'tier_free' | 'tier_pro' | 'tier_team' | undefined
  onClose: () => void
  subscriptionPlanMeta: any
  planMeta: any
  subscriptionPreviewError: any
  subscriptionPreviewIsLoading: boolean
  subscriptionPreviewInitialized: boolean
  subscriptionPreview: OrganizationBillingSubscriptionPreviewResponse
  billingViaPartner: boolean
  billingPartner?: string
  selectedOrganization: any
  subscription: any
  slug?: string
  currentPlanMeta: any
}

const SubscriptionPlanUpdateDialog = ({
  selectedTier,
  onClose,
  subscriptionPlanMeta,
  planMeta,
  subscriptionPreviewError,
  subscriptionPreviewIsLoading,
  subscriptionPreviewInitialized,
  subscriptionPreview,
  billingViaPartner,
  billingPartner,
  selectedOrganization,
  subscription,
  slug,
  currentPlanMeta,
}: Props) => {
  const queryClient = useQueryClient()
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>()
  const [testimonialTweet, setTestimonialTweet] = useState(getRandomTweet())

  useEffect(() => {
    if (selectedTier !== undefined && selectedTier !== 'tier_free') {
      setTestimonialTweet(getRandomTweet())
    }
  }, [selectedTier])

  const { mutate: updateOrgSubscription, isLoading: isUpdating } = useOrgSubscriptionUpdateMutation(
    {
      onSuccess: () => {
        toast.success(`Successfully updated subscription to ${subscriptionPlanMeta?.name}!`)
        onClose()
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
      },
      onError: (error) => {
        toast.error(`Unable to update subscription: ${error.message}`)
      },
    }
  )

  const onUpdateSubscription = async () => {
    if (!slug) return console.error('org slug is required')
    if (!selectedTier) return console.error('Selected plan is required')
    if (!selectedPaymentMethod && subscription?.payment_method_type !== 'invoice') {
      return toast.error('Please select a payment method')
    }

    if (selectedPaymentMethod) {
      queryClient.setQueriesData(organizationKeys.paymentMethods(slug), (prev: any) => {
        if (!prev) return prev
        return {
          ...prev,
          defaultPaymentMethodId: selectedPaymentMethod,
          data: prev.data.map((pm: any) => ({
            ...pm,
            is_default: pm.id === selectedPaymentMethod,
          })),
        }
      })
    }

    // If the user is downgrading from team, should have spend cap disabled by default
    const tier =
      subscription?.plan?.id === 'team' && selectedTier === PRICING_TIER_PRODUCT_IDS.PRO
        ? (PRICING_TIER_PRODUCT_IDS.PAYG as SubscriptionTier)
        : selectedTier

    updateOrgSubscription({ slug, tier, paymentMethod: selectedPaymentMethod })
  }

  const features = subscriptionPlanMeta?.features?.[0]?.features || []
  const topFeatures = features

  return (
    <Dialog
      open={selectedTier !== undefined && selectedTier !== 'tier_free'}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent size="xlarge" className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full items-stretch">
          {/* Left Column */}
          <div className="p-8 pb-8 flex flex-col">
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-4">
                Upgrade {selectedOrganization.name} to{' '}
                {PLAN_HEADINGS[(selectedTier as PlanHeadingKey) || 'default']}
              </h3>

              {subscriptionPreviewIsLoading && (
                <div className="space-y-2 mb-4 mt-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              )}
              {subscriptionPreviewInitialized && (
                <>
                  <Table className="mt-2 mb-4 text-foreground-light">
                    <TableBody>
                      {(() => {
                        // Calculate remaining days in current billing cycle
                        const now = Math.floor(Date.now() / 1000) // current time in seconds
                        const remainingSeconds = subscription?.current_period_end - now
                        const totalSeconds =
                          subscription?.current_period_end - subscription?.current_period_start
                        const remainingRatio = remainingSeconds / totalSeconds

                        // Calculate prorated credit for current plan
                        const currentPlanMonthlyPrice = currentPlanMeta?.price ?? 0
                        const proratedCredit = currentPlanMonthlyPrice * remainingRatio

                        // Calculate new plan cost
                        const newPlanCost = subscriptionPlanMeta?.priceMonthly ?? 0

                        const customerBalance = ((subscription?.customer_balance ?? 0) / 100) * -1

                        // Calculate total charge (new plan - prorated credit)
                        const totalCharge = Math.max(
                          0,
                          newPlanCost - proratedCredit - customerBalance
                        )

                        return (
                          <>
                            <TableRow>
                              <TableCell className="py-2 pl-0 flex items-center gap-1">
                                <span>{subscriptionPlanMeta?.name} Plan</span>
                                <Badge variant={'brand'} size={'small'}>
                                  New
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2 pr-0 text-right">
                                {formatCurrency(newPlanCost)}
                              </TableCell>
                            </TableRow>
                            {subscription?.plan?.id !== 'free' && (
                              <TableRow>
                                <TableCell className="py-2 pl-0 flex items-center gap-1">
                                  <span>Unused Time on {subscription?.plan?.name} Plan</span>
                                  <InfoTooltip className="max-w-sm">
                                    Your previous plan was charged upfront, so a plan change will
                                    prorate any unused time in credits. If the prorated credits
                                    exceed the new plan charge, the excessive credits are added to
                                    your organization for future use.
                                  </InfoTooltip>
                                </TableCell>
                                <TableCell className="py-2 pr-0 text-right">
                                  -{formatCurrency(proratedCredit)}
                                </TableCell>
                              </TableRow>
                            )}

                            {/* Ignore rare case with negative balance (debt) */}
                            {customerBalance > 0 && (
                              <TableRow>
                                <TableCell className="py-2 pl-0 flex items-center gap-1">
                                  <span>Credits</span>
                                  <InfoTooltip>
                                    Credits will be used first before charging your card.
                                  </InfoTooltip>
                                </TableCell>
                                <TableCell className="py-2 pr-0 text-right">
                                  {formatCurrency(customerBalance)}
                                </TableCell>
                              </TableRow>
                            )}
                            <TableRow className="text-foreground">
                              <TableCell className="py-2 pl-0 border-t">Charges today</TableCell>
                              <TableCell className="py-2 pr-0 text-right border-t">
                                {formatCurrency(totalCharge)}
                              </TableCell>
                            </TableRow>
                            {subscription?.plan?.id !== 'free' && (
                              <TableRow>
                                <TableCell className="py-2 pl-0 flex items-center gap-1">
                                  <span>+ current cycle usage</span>
                                  <InfoTooltip className="max-w-sm">
                                    Changing your plan resets your billing cycle. If your previous
                                    billing cycle still has any outstanding usage charges, they will
                                    be added to your total charge today.
                                  </InfoTooltip>
                                </TableCell>
                                <TableCell className="py-2 pr-0 text-right">
                                  <Link
                                    href={`/org/${slug}/billing#breakdown`}
                                    className="text-sm text-brand hover:text-brand-600 transition"
                                    target="_blank"
                                  >
                                    View spend
                                  </Link>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        )
                      })()}
                    </TableBody>
                  </Table>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Card className="cursor-help text-sm">
                        <CardContent className="flex items-center gap-2 py-2 px-3">
                          <InfoIcon strokeWidth={1.5} size={16} className="text-foreground-light" />
                          Monthly invoice estimate is{' '}
                          {formatCurrency(
                            Math.round(
                              subscriptionPreview?.breakdown.reduce(
                                (prev: number, cur: any) => prev + cur.total_price,
                                0
                              )
                            ) ?? 0
                          )}
                        </CardContent>
                      </Card>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-[520px] p-6">
                      <h3 className="text-md font-medium mb-2">Your new monthly invoice</h3>

                      {subscriptionPreviewError && (
                        <AlertError
                          error={subscriptionPreviewError}
                          subject="Failed to preview subscription."
                        />
                      )}

                      {subscriptionPreviewIsLoading && (
                        <div className="space-y-2 p-6">
                          <span className="text-sm">Estimating monthly costs...</span>
                          <ShimmeringLoader />
                          <ShimmeringLoader className="w-3/4" />
                          <ShimmeringLoader className="w-1/2" />
                        </div>
                      )}

                      {subscriptionPreviewInitialized && (
                        <>
                          <Table className="[&_tr:last-child]:border-t font-mono text-xs">
                            <TableBody>
                              {/* Non-compute items and Projects list */}
                              {(() => {
                                // Combine all compute-related projects
                                const computeItems = subscriptionPreview.breakdown.filter(
                                  (item) =>
                                    item.description?.toLowerCase().includes('compute') &&
                                    item.breakdown?.length > 0
                                )

                                const computeCreditsItem =
                                  subscriptionPreview.breakdown.find((item) =>
                                    item.description.startsWith('Compute Credits')
                                  ) ?? null

                                const allProjects = computeItems.flatMap((item) =>
                                  item.breakdown.map((project) => ({
                                    ...project,
                                    computeType: item.description,
                                    computeCosts: Math.round(
                                      item.total_price / item.breakdown.length
                                    ),
                                  }))
                                )

                                const nonComputeItems = subscriptionPreview.breakdown.filter(
                                  (item: any) =>
                                    !item.description?.toLowerCase().includes('compute')
                                )

                                const content = (
                                  <>
                                    {/* Non-compute items */}
                                    {nonComputeItems.map((item: any) => (
                                      <TableRow
                                        key={item.description}
                                        className="text-foreground-light"
                                      >
                                        <TableCell className="text-xs py-2 px-0">
                                          <div className="flex items-center gap-1">
                                            {item.description ?? 'Unknown'}
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-right text-xs py-2 px-0">
                                          {formatCurrency(item.total_price)}
                                        </TableCell>
                                      </TableRow>
                                    ))}

                                    {/* Combined projects section */}
                                    {allProjects.length > 0 && (
                                      <>
                                        <TableRow className="text-foreground-light">
                                          <TableCell className="!py-2 px-0 flex items-center gap-1">
                                            <span>Compute</span>
                                            <InfoTooltip className="max-w-sm">
                                              {' '}
                                              <p className="text-sm text-foreground-light mb-4 prose">
                                                Each project on a paid plan is a dedicated server
                                                running 24/7 with no pausing. The first project is
                                                covered by Compute Credits. Additional projects will
                                                incur compute costs starting at $10/month,
                                                independent of activity. See{' '}
                                                <Link
                                                  href={
                                                    '/docs/guides/platform/manage-your-usage/compute'
                                                  }
                                                  target="_blank"
                                                >
                                                  docs
                                                </Link>
                                                .
                                              </p>
                                              {subscription?.plan?.id === 'free' && (
                                                <>
                                                  <p className="text-sm text-foreground-light mb-4">
                                                    Mixing paid and non-paid projects in a single
                                                    organization is not possible. If you want
                                                    projects to be on the Free Plan, use self-serve
                                                    project transfers.
                                                  </p>
                                                  <div className="space-x-3 mt-2">
                                                    <Button
                                                      asChild
                                                      type="default"
                                                      icon={<ExternalLink strokeWidth={1.5} />}
                                                    >
                                                      <Link
                                                        href="/docs/guides/platform/manage-your-usage/compute"
                                                        target="_blank"
                                                        rel="noreferrer"
                                                      >
                                                        How billing for Compute works
                                                      </Link>
                                                    </Button>
                                                    <Button
                                                      asChild
                                                      type="default"
                                                      icon={<ExternalLink strokeWidth={1.5} />}
                                                    >
                                                      <Link
                                                        href="/docs/guides/platform/project-transfer"
                                                        target="_blank"
                                                        rel="noreferrer"
                                                      >
                                                        Project transfers
                                                      </Link>
                                                    </Button>
                                                  </div>
                                                </>
                                              )}
                                            </InfoTooltip>
                                          </TableCell>
                                          <TableCell className="text-right py-2 px-0">
                                            {formatCurrency(
                                              computeItems.reduce(
                                                (sum: number, item: any) => sum + item.total_price,
                                                0
                                              ) + (computeCreditsItem?.total_price ?? 0)
                                            )}
                                          </TableCell>
                                        </TableRow>
                                        {/* Show first 3 projects */}
                                        {allProjects.map((project: any) => (
                                          <TableRow
                                            key={project.project_ref}
                                            className="text-foreground-light"
                                          >
                                            <TableCell className="!py-2 px-0 pl-6">
                                              {project.project_name} ({project.computeType}) |{' '}
                                              {formatCurrency(project.computeCosts)}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                        {computeCreditsItem && (
                                          <TableRow className="text-foreground-light">
                                            <TableCell className="!py-2 px-0 pl-6">
                                              Compute Credits |{' '}
                                              {formatCurrency(computeCreditsItem.total_price)}
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </>
                                    )}
                                  </>
                                )
                                return content
                              })()}

                              <TableRow>
                                <TableCell className="font-medium py-2 px-0">
                                  Total per month (excluding other usage)
                                </TableCell>
                                <TableCell className="text-right font-medium py-2 px-0">
                                  {formatCurrency(
                                    Math.round(
                                      subscriptionPreview.breakdown.reduce(
                                        (prev: number, cur: any) => prev + cur.total_price,
                                        0
                                      )
                                    ) ?? 0
                                  )}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </>
                      )}
                    </HoverCardContent>
                  </HoverCard>
                </>
              )}
            </div>

            <div className="mt-4 pt-4">
              {!billingViaPartner ? (
                <div className="space-y-4">
                  <PaymentMethodSelection
                    selectedPaymentMethod={selectedPaymentMethod}
                    onSelectPaymentMethod={setSelectedPaymentMethod}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm">
                    This organization is billed through our partner{' '}
                    {billingPartnerLabel(billingPartner)}.{' '}
                    {billingPartner === 'aws' ? (
                      <>The organization's credit balance will be decreased accordingly.</>
                    ) : (
                      <>You will be charged by them directly.</>
                    )}
                  </p>
                  {billingViaPartner &&
                    billingPartner === 'fly' &&
                    subscriptionPreview?.plan_change_type === 'downgrade' && (
                      <p className="text-sm">
                        Your organization will be downgraded at the end of your current billing
                        cycle.
                      </p>
                    )}
                </div>
              )}
              <div className="flex space-x-4">
                <Button type="default" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  loading={isUpdating}
                  type="primary"
                  onClick={onUpdateSubscription}
                  className="flex-1"
                >
                  Confirm {planMeta?.change_type === 'downgrade' ? 'Downgrade' : 'Upgrade'}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="bg-surface-100 p-8 flex flex-col border-l">
            {topFeatures.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm mb-2">Upgrade features</h3>

                <div className="space-y-2 mb-4 text-foreground-light">
                  {topFeatures.map((feature: string | [string, ...any[]]) => (
                    <div
                      key={typeof feature === 'string' ? feature : feature[0]}
                      className="flex items-center gap-2"
                    >
                      <div className="w-4">
                        <Check className="h-3 w-3 text-brand" strokeWidth={3} />
                      </div>
                      <p className="text-sm">
                        {typeof feature === 'string' ? feature : feature[0]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="border-t pt-6">
              <blockquote className="text-sm text-foreground-light italic">
                {testimonialTweet.text}
                <div className="mt-2 text-foreground">— @{testimonialTweet.handle}</div>
              </blockquote>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SubscriptionPlanUpdateDialog
