import { PermissionAction } from '@supabase/shared-types/out/constants'
import clsx from 'clsx'
import { useParams, useTheme } from 'common'
import Table from 'components/to-be-cleaned/Table'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useOrgSubscriptionUpdateMutation } from 'data/subscriptions/org-subscription-update-mutation'
import { useCheckPermissions, useStore } from 'hooks'
import { BASE_PATH, PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import Telemetry from 'lib/telemetry'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { pricing } from 'shared-data/pricing'
import { useOrgSettingsPageStateSnapshot } from 'state/organization-settings'
import { Alert, Button, Collapsible, IconChevronRight, IconExternalLink, SidePanel } from 'ui'

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
  const { ui } = useStore()
  const router = useRouter()
  const { slug } = useParams()
  const { isDarkMode } = useTheme()

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
        ui.setNotification({
          category: 'success',
          message: `Successfully ${isTurningOnCap ? 'enabled' : 'disabled'} spend cap`,
        })

        onClose()
      },
      onError: (error) => {
        ui.setNotification({
          error,
          category: 'error',
          message: `Failed to toggle spend cap: ${error.message}`,
        })
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
      Telemetry.sendActivity(
        {
          activity: 'Side Panel Viewed',
          source: 'Dashboard',
          data: {
            title: 'Spend cap',
            section: 'Cost Control',
          },
          ...(slug && { orgSlug: slug }),
        },
        router
      )
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
          <Link href="https://iechor.com/docs/guides/platform/spend-cap">
            <a target="_blank" rel="noreferrer">
              <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                About spend cap
              </Button>
            </a>
          </Link>
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
                <IconChevronRight
                  strokeWidth={1.5}
                  size={16}
                  className={showUsageCosts ? 'rotate-90' : ''}
                />
                <p className="text-sm text-scale-1100">
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
                          <p className="text-xs text-scale-1200">{category.title}</p>
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
              title="Toggling of the spend cap is only available on the Pro plan"
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
                    className={clsx('col-span-4 group space-y-1', isFreePlan && 'opacity-75')}
                    onClick={() => {
                      !isFreePlan && setSelectedOption(option.value)
                      Telemetry.sendActivity(
                        {
                          activity: 'Option Selected',
                          source: 'Dashboard',
                          data: {
                            title: 'Spend cap',
                            section: 'Cost Control',
                            option: option.name,
                          },
                          ...(slug && { orgSlug: slug }),
                        },
                        router
                      )
                    }}
                  >
                    <img
                      alt="Spend Cap"
                      className={clsx(
                        'relative rounded-xl transition border bg-no-repeat bg-center bg-cover w-[160px] h-[96px]',
                        isSelected
                          ? 'border-scale-1200'
                          : 'border-scale-900 opacity-50 group-hover:border-scale-1000 group-hover:opacity-100',
                        !isFreePlan && 'cursor-pointer',
                        !isFreePlan && !isSelected && 'group-hover:border-scale-1100'
                      )}
                      width={160}
                      height={96}
                      src={isDarkMode ? option.imageUrl : option.imageUrlLight}
                    />

                    <p
                      className={clsx(
                        'text-sm transition',
                        !isFreePlan && 'group-hover:text-scale-1200',
                        isSelected ? 'text-scale-1200' : 'text-scale-1000'
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
                  : 'Upon clicking confirm, spend cap will be disabled for your organization and you will be charged for any usage beyong the included quota.'}
              </p>
            </>
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default SpendCapSidePanel
