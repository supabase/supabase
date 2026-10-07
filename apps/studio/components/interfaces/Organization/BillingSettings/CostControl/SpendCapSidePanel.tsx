import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { pricing } from 'shared-data/pricing'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useOrgSubscriptionUpdateMutation } from '@/data/subscriptions/org-subscription-update-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { BASE_PATH, DOCS_URL, PRICING_TIER_PRODUCT_IDS } from '@/lib/constants'
import { PROJECT_STATUS } from '@/lib/constants/infrastructure'
import { useOrgSettingsPageStateSnapshot } from '@/state/organization-settings'

const BILLING_METRIC_CATEGORIES: (keyof typeof pricing)[] = [
  'database',
  'auth',
  'storage',
  'realtime',
  'edge_functions',
]

const SPEND_CAP_OPTIONS: {
  name: string
  value: 'on' | 'off'
  imageUrl: string
  imageUrlLight: string
}[] = [
  {
    name: 'Spend cap enabled',
    value: 'on',
    imageUrl: `${BASE_PATH}/img/spend-cap-on.png`,
    imageUrlLight: `${BASE_PATH}/img/spend-cap-on--light.png`,
  },
  {
    name: 'Spend cap disabled',
    value: 'off',
    imageUrl: `${BASE_PATH}/img/spend-cap-off.png`,
    imageUrlLight: `${BASE_PATH}/img/spend-cap-off--light.png`,
  },
]

export const SpendCapSidePanel = () => {
  const { slug } = useParams()
  const { resolvedTheme } = useTheme()

  const [showUsageCosts, setShowUsageCosts] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'on' | 'off'>()

  const { can: canUpdateSpendCap } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const snap = useOrgSettingsPageStateSnapshot()
  const visible = snap.panelKey === 'costControl'
  const onClose = () => snap.setPanelKey(undefined)

  const { data } = useOrgProjectsInfiniteQuery({ slug })
  const projects = useMemo(() => data?.pages.flatMap((page) => page.projects) || [], [data?.pages])

  const hasReplicas = useMemo(
    () =>
      projects.some(
        (it) =>
          it.status !== PROJECT_STATUS.INACTIVE &&
          it.databases.some((db) => db.type === 'READ_REPLICA')
      ),
    [projects]
  )

  const { data: subscription, isPending: isLoading } = useOrgSubscriptionQuery({ orgSlug: slug })
  const { mutate: updateOrgSubscription, isPending: isUpdating } = useOrgSubscriptionUpdateMutation(
    {
      onSuccess: () => {
        toast.success(`Successfully ${isTurningOnCap ? 'enabled' : 'disabled'} spend cap`)
        onClose()
      },
      onError: (error) => {
        toast.error(`Failed to toggle spend cap: ${error.message}`)
      },
    }
  )

  const isFreePlan = subscription?.plan?.id === 'free'
  const isSpendCapOn = !subscription?.usage_billing_enabled
  const isTurningOnCap = !isSpendCapOn && selectedOption === 'on'
  const hasChanges = selectedOption !== (isSpendCapOn ? 'on' : 'off')
  const isBlockedByReplicas = isTurningOnCap && hasReplicas

  const disabled =
    isFreePlan ||
    isLoading ||
    !hasChanges ||
    isUpdating ||
    !canUpdateSpendCap ||
    isBlockedByReplicas

  const confirmTooltipText = !canUpdateSpendCap
    ? 'You do not have permission to update spend cap'
    : isBlockedByReplicas
      ? 'Remove your read replicas before enabling the spend cap'
      : undefined

  const onConfirm = async () => {
    if (!slug) return console.error('Org slug is required')

    const tier = (
      selectedOption === 'on' ? PRICING_TIER_PRODUCT_IDS.PRO : PRICING_TIER_PRODUCT_IDS.PAYG
    ) as 'tier_pro' | 'tier_payg'

    updateOrgSubscription({ slug, tier })
  }

  useEffect(() => {
    if (visible && subscription !== undefined) {
      setSelectedOption(isSpendCapOn ? 'on' : 'off')
    }
  }, [visible, isLoading, subscription, isSpendCapOn])

  return (
    <Sheet open={visible} onOpenChange={() => onClose()}>
      <SheetContent showClose={false} size="lg" className="flex flex-col gap-0">
        <SheetHeader className="flex items-center justify-between w-full">
          <SheetTitle>Spend cap</SheetTitle>
          <Button asChild icon={<ExternalLink strokeWidth={1.5} />}>
            <Link
              href={`${DOCS_URL}/guides/platform/cost-control#spend-cap`}
              target="_blank"
              rel="noreferrer"
            >
              About spend cap
            </Link>
          </Button>
        </SheetHeader>

        <SheetSection className="overflow-auto grow">
          <div className="space-y-4">
            <p className="text-sm">
              Use the spend cap to manage project usage and costs, and control whether the project
              can exceed the included quota allowance of any billed line item in a billing cycle
            </p>

            <Collapsible open={showUsageCosts} onOpenChange={setShowUsageCosts}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center space-x-2 cursor-pointer">
                  <ChevronRight
                    strokeWidth={1.5}
                    size={16}
                    className={showUsageCosts ? 'rotate-90' : ''}
                  />
                  <p className="text-sm text-foreground-light">
                    How is each resource charged after exceeding the included quota?
                  </p>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent asChild>
                <Card className="mt-4">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="h-9 text-xs">Item</TableHead>
                          <TableHead className="h-9 text-xs">Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {BILLING_METRIC_CATEGORIES.map((categoryId) => {
                          const category = pricing[categoryId]
                          const usageItems = category.features.filter((it) => it.usage_based)

                          return (
                            <Fragment key={categoryId}>
                              <TableRow>
                                <TableCell className="py-2 text-xs text-foreground">
                                  {category.title}
                                </TableCell>
                                <TableCell className="py-2" />
                              </TableRow>
                              {usageItems.map((item) => (
                                <TableRow
                                  key={item.title}
                                  className="[&>td]:text-foreground-lighter"
                                >
                                  <TableCell className="py-2 text-xs pl-8">{item.title}</TableCell>
                                  <TableCell className="py-2 text-xs">
                                    {Array.isArray(item.plans['pro'])
                                      ? item.plans['pro']?.join(', ')
                                      : item.plans['pro']}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </Fragment>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {isFreePlan && (
              <Admonition
                type="note"
                layout="horizontal"
                title="Toggling of the spend cap is only available on the Pro Plan"
                description="Upgrade your plan to disable the spend cap"
                actions={
                  <Button onClick={() => snap.setPanelKey('subscriptionPlan')}>
                    View available plans
                  </Button>
                }
              />
            )}

            <div className="mt-8! pb-4">
              <div className="flex gap-3">
                {SPEND_CAP_OPTIONS.map((option) => {
                  const isSelected = selectedOption === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={isFreePlan}
                      tabIndex={isFreePlan ? -1 : 0}
                      className={cn(
                        'col-span-4 group space-y-1 flex flex-col items-start text-left bg-transparent border-0 p-0',
                        isFreePlan && 'opacity-75 cursor-not-allowed'
                      )}
                      onClick={() => !isFreePlan && setSelectedOption(option.value)}
                    >
                      <Image
                        alt="Spend Cap"
                        className={cn(
                          'relative rounded-xl transition border bg-no-repeat bg-center bg-cover w-[160px] h-[96px]',
                          isSelected
                            ? 'border-foreground'
                            : 'border-foreground-muted opacity-50 group-hover:border-foreground-lighter group-hover:opacity-100',
                          !isFreePlan && 'cursor-pointer',
                          !isFreePlan && !isSelected && 'group-hover:border-foreground-light'
                        )}
                        width={160}
                        height={96}
                        src={
                          resolvedTheme?.includes('dark') ? option.imageUrl : option.imageUrlLight
                        }
                      />

                      <p
                        className={cn(
                          'text-sm transition',
                          !isFreePlan && 'group-hover:text-foreground',
                          isSelected ? 'text-foreground' : 'text-foreground-light'
                        )}
                      >
                        {option.name}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {isBlockedByReplicas ? (
              <Admonition
                type="warning"
                title="Remove read replicas before enabling the Spend Cap"
                description="Read replicas add disk usage beyond your plan's included quota, which isn't allowed once the Spend Cap is on. Remove your read replicas first, or keep the Spend Cap disabled."
              />
            ) : selectedOption === 'on' ? (
              <Admonition
                type="warning"
                title="Your projects could become unresponsive or enter read only mode"
                description="Exceeding the included quota allowance with spend cap enabled can cause your projects to become unresponsive or enter read only mode."
              />
            ) : (
              <Admonition
                type="note"
                title="Charges apply for usage beyond included quota allowance"
                description="Your projects will always remain responsive and active, and charges only apply when exceeding the included quota limit."
              />
            )}

            {hasChanges && !disabled && (
              <>
                <p className="text-sm">
                  {selectedOption === 'on'
                    ? 'Upon clicking confirm, spend cap will be enabled for your organization and you will no longer be charged any extra for usage.'
                    : 'Upon clicking confirm, spend cap will be disabled for your organization and you will be charged for any usage beyond the included quota.'}
                </p>
                <p className="text-sm">
                  Toggling spend cap triggers an invoice and there might be prorated charges for any
                  usage beyond the Pro Plans quota during this billing cycle.
                </p>
              </>
            )}
          </div>
        </SheetSection>

        <SheetFooter>
          <Button onClick={onClose}>Cancel</Button>
          <ButtonTooltip
            variant="primary"
            loading={isUpdating}
            disabled={disabled}
            onClick={onConfirm}
            tooltip={{ content: { text: confirmTooltipText } }}
          >
            Confirm
          </ButtonTooltip>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
