import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useOrgSubscriptionUpdateMutation } from 'data/subscriptions/org-subscription-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { BASE_PATH, PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { pricing } from 'shared-data/pricing'
import { useOrgSettingsPageStateSnapshot } from 'state/organization-settings'
import { Alert, Button, Collapsible, SidePanel, cn } from 'ui'
import { ExternalLink, ChevronRight } from 'lucide-react'

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

const SpendCapSidePanel = () => {
  const { slug } = useParams()
  const { resolvedTheme } = useTheme()

  const [showUsageCosts, setShowUsageCosts] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'on' | 'off'>()

  const canUpdateSpendCap = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const snap = useOrgSettingsPageStateSnapshot()
  const visible = snap.panelKey === 'costControl'
  const onClose = () => snap.setPanelKey(undefined)

  const { data: subscription, isLoading } = useOrgSubscriptionQuery({ orgSlug: slug })
  const { mutate: updateOrgSubscription, isLoading: isUpdating } = useOrgSubscriptionUpdateMutation(
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

  useEffect(() => {
    if (visible && subscription !== undefined) {
      setSelectedOption(isSpendCapOn ? 'on' : 'off')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, isLoading, subscription, isSpendCapOn])

  const onConfirm = async () => {
    if (!slug) return console.error('Org slug is required')

    const tier = (
      selectedOption === 'on' ? PRICING_TIER_PRODUCT_IDS.PRO : PRICING_TIER_PRODUCT_IDS.PAYG
    ) as 'tier_pro' | 'tier_payg'

    updateOrgSubscription({ slug, tier })
  }

  const billingMetricCategories: (keyof typeof pricing)[] = [
    'database',
    'auth',
    'storage',
    'realtime',
    'edge_functions',
  ]

  return (
    <SidePanel
      size="large"
      loading={isLoading || isUpdating}
      disabled={isFreePlan || isLoading || !hasChanges || isUpdating || !canUpdateSpendCap}
      visible={visible}
      onCancel={onClose}
      onConfirm={onConfirm}
      header={
        <div className="flex items-center justify-between">
          <h4>Spend cap</h4>
          <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
            <Link
              href="https://supabase.com/docs/guides/platform/spend-cap"
              target="_blank"
              rel="noreferrer"
            >
              About spend cap
            </Link>
          </Button>
        </div>
      }
      tooltip={!canUpdateSpendCap ? 'You do not have permission to update spend cap' : undefined}
    >
      <SidePanel.Content>
        <div className="py-6 space-y-4">
          <p className="text-sm">
            Use the spend cap to manage project usage and costs, and control whether the project can
            exceed the included quota allowance of any billed line item in a billing cycle
          </p>

          <Collapsible open={showUsageCosts} onOpenChange={setShowUsageCosts}>
            <Collapsible.Trigger asChild>
              <div className="flex items-center space-x-2 cursor-pointer">
                <ChevronRight
                  strokeWidth={1.5}
                  size={16}
                  className={showUsageCosts ? 'rotate-90' : ''}
                />
                <p className="text-sm text-foreground-light">
                  How are each resource charged after exceeding the included quota?
                </p>
              </div>
            </Collapsible.Trigger>
            <Collapsible.Content asChild>
              <Table
                className="mt-4"
                head={
                  <>
                    <Table.th>
                      <p className="text-xs">Item</p>
                    </Table.th>
                    <Table.th>
                      <p className="text-xs">Rate</p>
                    </Table.th>
                  </>
                }
                body={billingMetricCategories.map((categoryId) => {
                  const category = pricing[categoryId]
                  const usageItems = category.features.filter((it: any) => it.usage_based)

                  return (
                    <>
                      <Table.tr key={categoryId}>
                        <Table.td>
                          <p className="text-xs text-foreground">{category.title}</p>
                        </Table.td>
                        <Table.td>{null}</Table.td>
                      </Table.tr>
                      {usageItems.map((item: any) => {
                        return (
                          <Table.tr key={item.title}>
                            <Table.td>
                              <p className="text-xs pl-4">{item.title}</p>
                            </Table.td>
                            <Table.td>
                              <p className="text-xs pl-4">{item.plans['pro']}</p>
                            </Table.td>
                          </Table.tr>
                        )
                      })}
                    </>
                  )
                })}
              />
            </Collapsible.Content>
          </Collapsible>

          {isFreePlan && (
            <Alert
              withIcon
              variant="info"
              title="Toggling of the spend cap is only available on the Pro Plan"
              actions={
                <Button type="default" onClick={() => snap.setPanelKey('subscriptionPlan')}>
                  View available plans
                </Button>
              }
            >
              Upgrade your plan to disable the spend cap
            </Alert>
          )}

          <div className="!mt-8 pb-4">
            <div className="flex gap-3">
              {SPEND_CAP_OPTIONS.map((option) => {
                const isSelected = selectedOption === option.value

                return (
                  <div
                    key={option.value}
                    className={cn('col-span-4 group space-y-1', isFreePlan && 'opacity-75')}
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
                      src={resolvedTheme?.includes('dark') ? option.imageUrl : option.imageUrlLight}
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
                  </div>
                )
              })}
            </div>
          </div>

          {selectedOption === 'on' ? (
            <Alert
              withIcon
              variant="warning"
              title="Your projects could become unresponsive or enter read only mode"
            >
              Exceeding the included quota allowance with spend cap enabled can cause your projects
              to become unresponsive or enter read only mode.
            </Alert>
          ) : (
            <Alert
              withIcon
              variant="info"
              title="Charges apply for usage beyond included quota allowance"
            >
              Your projects will always remain responsive and active, and charges only apply when
              exceeding the included quota limit.
            </Alert>
          )}

          {hasChanges && (
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
      </SidePanel.Content>
    </SidePanel>
  )
}

export default SpendCapSidePanel
