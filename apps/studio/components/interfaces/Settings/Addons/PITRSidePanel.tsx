import { PermissionAction } from '@supabase/shared-types/out/constants'
import clsx from 'clsx'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { useTheme } from 'next-themes'
import { useProjectAddonRemoveMutation } from 'data/subscriptions/project-addon-remove-mutation'
import { useProjectAddonUpdateMutation } from 'data/subscriptions/project-addon-update-mutation'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useCheckPermissions, useSelectedOrganization, useSelectedProject, useStore } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import Telemetry from 'lib/telemetry'

import { useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import {
  Alert,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconExternalLink,
  Radio,
  SidePanel,
  IconAlertTriangle,
} from 'ui'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { AlertTriangleIcon } from 'lucide-react'
import { AddonVariantId } from 'data/subscriptions/types'
import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { formatCurrency } from 'lib/helpers'

const PITR_CATEGORY_OPTIONS: {
  id: 'off' | 'on'
  name: string
  imageUrl: string
  imageUrlLight: string
}[] = [
  {
    id: 'off',
    name: 'Disable PITR',
    imageUrl: `${BASE_PATH}/img/pitr-off.svg?v=2`,
    imageUrlLight: `${BASE_PATH}/img/pitr-off--light.svg?v=2`,
  },
  {
    id: 'on',
    name: 'Enable PITR',
    imageUrl: `${BASE_PATH}/img/pitr-on.svg?v=2`,
    imageUrlLight: `${BASE_PATH}/img/pitr-on--light.svg?v=2`,
  },
]

const PITRSidePanel = () => {
  const { ui } = useStore()
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { resolvedTheme } = useTheme()
  const project = useSelectedProject()
  const organization = useSelectedOrganization()

  const [selectedCategory, setSelectedCategory] = useState<'on' | 'off'>('off')
  const [selectedOption, setSelectedOption] = useState<string>('pitr_0')

  const canUpdatePitr = useCheckPermissions(PermissionAction.BILLING_WRITE, 'stripe.subscriptions')
  const isBranchingEnabled =
    project?.is_branch_enabled === true || project?.parent_project_ref !== undefined

  const snap = useSubscriptionPageStateSnapshot()
  const visible = snap.panelKey === 'pitr'
  const onClose = () => {
    const { panel, ...queryWithoutPanel } = router.query
    router.push({ pathname: router.pathname, query: queryWithoutPanel }, undefined, {
      shallow: true,
    })
    snap.setPanelKey(undefined)
  }

  const { data: addons, isLoading } = useProjectAddonsQuery({ projectRef })
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  const { mutate: updateAddon, isLoading: isUpdating } = useProjectAddonUpdateMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: `Successfully updated point in time recovery duration`,
      })
      onClose()
    },
    onError: (error) => {
      ui.setNotification({
        error,
        category: 'error',
        message: `Unable to update PITR: ${error.message}`,
      })
    },
  })
  const { mutate: removeAddon, isLoading: isRemoving } = useProjectAddonRemoveMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: `Successfully disabled point in time recovery`,
      })
      onClose()
    },
    onError: (error) => {
      ui.setNotification({
        error,
        category: 'error',
        message: `Unable to disable PITR: ${error.message}`,
      })
    },
  })
  const isSubmitting = isUpdating || isRemoving

  const selectedAddons = addons?.selected_addons ?? []
  const availableAddons = addons?.available_addons ?? []

  const subscriptionCompute = selectedAddons.find((addon) => addon.type === 'compute_instance')
  const subscriptionPitr = selectedAddons.find((addon) => addon.type === 'pitr')
  const availableOptions = availableAddons.find((addon) => addon.type === 'pitr')?.variants ?? []

  const hasChanges = selectedOption !== (subscriptionPitr?.variant.identifier ?? 'pitr_0')
  const selectedPitr = availableOptions.find((option) => option.identifier === selectedOption)
  const isFreePlan = subscription?.plan?.id === 'free'

  useEffect(() => {
    if (visible) {
      if (subscriptionPitr !== undefined) {
        setSelectedCategory('on')
        setSelectedOption(subscriptionPitr.variant.identifier)
      } else {
        setSelectedCategory('off')
        setSelectedOption('pitr_0')
      }
      Telemetry.sendActivity(
        {
          activity: 'Side Panel Viewed',
          source: 'Dashboard',
          data: {
            title: 'Point in Time Recovery',
            section: 'Add ons',
          },
          projectRef,
        },
        router
      )
    }
  }, [visible, isLoading])

  const onConfirm = async () => {
    if (!projectRef) return console.error('Project ref is required')

    if (selectedOption === 'pitr_0' && subscriptionPitr !== undefined) {
      removeAddon({ projectRef, variant: subscriptionPitr.variant.identifier })
    } else {
      updateAddon({ projectRef, type: 'pitr', variant: selectedOption as AddonVariantId })
    }
  }

  return (
    <SidePanel
      size="xlarge"
      visible={visible}
      onCancel={onClose}
      onConfirm={onConfirm}
      loading={isLoading || isSubmitting}
      disabled={
        isFreePlan || isLoading || !hasChanges || isSubmitting || !canUpdatePitr || hasHipaaAddon
      }
      tooltip={
        hasHipaaAddon
          ? 'Unable to change PITR with HIPAA add-on'
          : isFreePlan
          ? 'Unable to enable point in time recovery on a free plan'
          : !canUpdatePitr
          ? 'You do not have permission to update PITR'
          : undefined
      }
      header={
        <div className="flex items-center justify-between">
          <h4>Point in Time Recovery</h4>
          <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
            <Link
              href="https://supabase.com/docs/guides/platform/backups#point-in-time-recovery"
              target="_blank"
              rel="noreferrer"
            >
              About point in time recovery
            </Link>
          </Button>
        </div>
      }
    >
      <SidePanel.Content>
        {hasHipaaAddon && (
          <Alert_Shadcn_>
            <AlertTitle_Shadcn_>PITR cannot be changed with HIPAA</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              All projects should have PITR enabled by default and cannot be changed with HIPAA
              enabled. Contact support for further assistance.
            </AlertDescription_Shadcn_>
            <div className="mt-4">
              <Button type="default" asChild>
                <Link href="/support/new">Contact support</Link>
              </Button>
            </div>
          </Alert_Shadcn_>
        )}
        <div className="py-6 space-y-4">
          <p className="text-sm">
            Point-in-Time Recovery (PITR) allows a project to be backed up at much shorter
            intervals. This provides users an option to restore to any chosen point of up to seconds
            in granularity.
          </p>

          <div className="!mt-8 pb-4">
            <div className="flex gap-3">
              {PITR_CATEGORY_OPTIONS.map((option) => {
                const isSelected = selectedCategory === option.id
                return (
                  <div
                    key={option.id}
                    className={clsx('col-span-3 group space-y-1', isFreePlan && 'opacity-75')}
                    onClick={() => {
                      setSelectedCategory(option.id)
                      if (option.id === 'off') setSelectedOption('pitr_0')
                      Telemetry.sendActivity(
                        {
                          activity: 'Option Selected',
                          source: 'Dashboard',
                          data: {
                            title: 'Point in Time Recovery',
                            section: 'Add ons',
                            option: option.name,
                          },
                          projectRef,
                        },
                        router
                      )
                    }}
                  >
                    <img
                      alt="Point-In-Time-Recovery"
                      className={clsx(
                        'relative rounded-xl transition border bg-no-repeat bg-center bg-cover cursor-pointer w-[160px] h-[96px]',
                        isSelected
                          ? 'border-foreground'
                          : 'border-foreground-muted opacity-50 group-hover:border-foreground-lighter group-hover:opacity-100'
                      )}
                      width={160}
                      height={96}
                      src={resolvedTheme?.includes('dark') ? option.imageUrl : option.imageUrlLight}
                    />

                    <p
                      className={clsx(
                        'text-sm transition',
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

          {selectedCategory === 'off' && subscriptionPitr !== undefined && isBranchingEnabled && (
            <Alert_Shadcn_ variant="warning">
              <AlertTriangleIcon strokeWidth={2} />
              <AlertTitle_Shadcn_>
                Are you sure you want to disable this while using Branching?
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                Without PITR, you might not be able to recover lost data if you accidentally merge a
                branch that deletes a column or user data. We don't recommend this.
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}

          {selectedCategory === 'on' && (
            <div className="!mt-8 pb-4">
              {isFreePlan ? (
                <Alert
                  withIcon
                  variant="info"
                  className="mb-4"
                  title="Changing your Point-In-Time-Recovery is only available on the Pro plan"
                  actions={
                    <Button asChild type="default">
                      <Link href={`/org/${organization?.slug}/billing?panel=subscriptionPlan`}>
                        View available plans
                      </Link>
                    </Button>
                  }
                >
                  Upgrade your plan to change PITR for your project
                </Alert>
              ) : subscriptionCompute === undefined ? (
                <Alert
                  withIcon
                  variant="warning"
                  className="mb-4"
                  title="Your project is required to minimally be on a Small compute size to enable PITR"
                  actions={[
                    <Button
                      key="change-compute"
                      type="default"
                      onClick={() => snap.setPanelKey('computeInstance')}
                    >
                      Change compute size
                    </Button>,
                  ]}
                >
                  This is to ensure that your project has enough resources to execute PITR
                  successfully
                </Alert>
              ) : null}

              <Radio.Group
                type="large-cards"
                size="tiny"
                id="pitr"
                label={<p className="text-sm">Choose the duration of recovery</p>}
                onChange={(event: any) => setSelectedOption(event.target.value)}
              >
                {availableOptions.map((option) => (
                  <Radio
                    name="pitr"
                    disabled={isFreePlan || subscriptionCompute === undefined}
                    className="col-span-4 !p-0"
                    key={option.identifier}
                    checked={selectedOption === option.identifier}
                    label={<span className="text-sm">{option.name}</span>}
                    value={option.identifier}
                  >
                    <div className="w-full group">
                      <div className="border-b border-default px-4 py-2">
                        <p className="text-sm">{option.name}</p>
                      </div>
                      <div className="px-4 py-2">
                        <p className="text-foreground-light">
                          Allow database restorations to any time up to{' '}
                          {option.identifier.split('_')[1]} days ago
                        </p>
                        <div className="flex items-center space-x-1 mt-2">
                          <p className="text-foreground text-sm">{formatCurrency(option.price)}</p>
                          <p className="text-foreground-light translate-y-[1px]"> / month</p>
                        </div>
                      </div>
                    </div>
                  </Radio>
                ))}
              </Radio.Group>
            </div>
          )}

          {hasChanges && (
            <>
              {selectedOption === 'pitr_0' ||
              (selectedPitr?.price ?? 0) < (subscriptionPitr?.variant.price ?? 0) ? (
                subscription?.billing_via_partner === false && (
                  <p className="text-sm text-foreground-light">
                    Upon clicking confirm, the add-on is removed immediately and any unused time in
                    the current billing cycle is added as prorated credits to your organization and
                    used in subsequent billing cycles.
                  </p>
                )
              ) : (
                <p className="text-sm text-foreground-light">
                  Upon clicking confirm, the amount of{' '}
                  <span className="text-foreground">{formatCurrency(selectedPitr?.price)}</span>{' '}
                  will be added to your monthly invoice.{' '}
                  {subscription?.billing_via_partner ? (
                    <>
                      For the current billing cycle you'll be charged a prorated amount at the end
                      of the cycle.{' '}
                    </>
                  ) : (
                    <>
                      The addon is prepaid per month and in case of a downgrade, you get credits for
                      the remaining time. For the current billing cycle you're immediately charged a
                      prorated amount for the remaining days.
                    </>
                  )}
                </p>
              )}

              {subscription?.billing_via_partner &&
                subscription.scheduled_plan_change?.target_plan !== undefined && (
                  <Alert_Shadcn_ variant={'warning'} className="mb-2">
                    <IconAlertTriangle className="h-4 w-4" />
                    <AlertDescription_Shadcn_>
                      You have a scheduled subscription change that will be canceled if you change
                      your PITR add on.
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}
            </>
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default PITRSidePanel
