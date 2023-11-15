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
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import Telemetry from 'lib/telemetry'

import { useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import { Alert, Button, IconExternalLink, Radio, SidePanel } from 'ui'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'

const PITR_CATEGORY_OPTIONS: {
  id: 'off' | 'on'
  name: string
  imageUrl: string
  imageUrlLight: string
}[] = [
  {
    id: 'off',
    name: 'Disable PITR',
    imageUrl: `${BASE_PATH}/img/pitr-off.png?v=2`,
    imageUrlLight: `${BASE_PATH}/img/pitr-off--light.png?v=2`,
  },
  {
    id: 'on',
    name: 'Enable PITR',
    imageUrl: `${BASE_PATH}/img/pitr-on.png?v=2`,
    imageUrlLight: `${BASE_PATH}/img/pitr-on--light.png?v=2`,
  },
]

const PITRSidePanel = () => {
  const { ui } = useStore()
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { resolvedTheme } = useTheme()
  const organization = useSelectedOrganization()

  const [selectedCategory, setSelectedCategory] = useState<'on' | 'off'>('off')
  const [selectedOption, setSelectedOption] = useState<string>('pitr_0')

  const canUpdatePitr = useCheckPermissions(PermissionAction.BILLING_WRITE, 'stripe.subscriptions')

  const snap = useSubscriptionPageStateSnapshot()
  const visible = snap.panelKey === 'pitr'
  const onClose = () => snap.setPanelKey(undefined)

  const { data: addons, isLoading } = useProjectAddonsQuery({ projectRef })
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
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
      updateAddon({ projectRef, type: 'pitr', variant: selectedOption })
    }
  }

  return (
    <SidePanel
      size="xlarge"
      visible={visible}
      onCancel={onClose}
      onConfirm={onConfirm}
      loading={isLoading || isSubmitting}
      disabled={isFreePlan || isLoading || !hasChanges || isSubmitting || !canUpdatePitr}
      tooltip={
        isFreePlan
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
                      src={resolvedTheme === 'dark' ? option.imageUrl : option.imageUrlLight}
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
                          <p className="text-foreground text-sm">
                            ${option.price.toLocaleString()}
                          </p>
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
                <p className="text-sm text-foreground-light">
                  Upon clicking confirm, the amount of that's unused during the current billing
                  cycle will be returned as credits that can be used for subsequent billing cycles
                </p>
              ) : (
                <p className="text-sm text-foreground-light">
                  Upon clicking confirm, the amount of{' '}
                  <span className="text-foreground">${selectedPitr?.price.toLocaleString()}</span>{' '}
                  will be added to your monthly invoice. You're immediately charged for the
                  remaining days of your billing cycle. The addon is prepaid per month and in case
                  of a downgrade, you get credits for the remaining time.
                </p>
              )}
            </>
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default PITRSidePanel
