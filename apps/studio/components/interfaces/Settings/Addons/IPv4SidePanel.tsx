import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useProjectAddonRemoveMutation } from 'data/subscriptions/project-addon-remove-mutation'
import { useProjectAddonUpdateMutation } from 'data/subscriptions/project-addon-update-mutation'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import type { AddonVariantId } from 'data/subscriptions/types'
import { useCheckPermissions, useSelectedOrganization } from 'hooks'
import { formatCurrency } from 'lib/helpers'
import Telemetry from 'lib/telemetry'
import { useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import { Alert, Button, cn, IconExternalLink, Radio, SidePanel } from 'ui'

const IPv4SidePanel = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const organization = useSelectedOrganization()

  const [selectedOption, setSelectedOption] = useState<string>('ipv4_none')

  const canUpdateIPv4 = useCheckPermissions(PermissionAction.BILLING_WRITE, 'stripe.subscriptions')

  const snap = useSubscriptionPageStateSnapshot()
  const visible = snap.panelKey === 'ipv4'
  const onClose = () => {
    const { panel, ...queryWithoutPanel } = router.query
    router.push({ pathname: router.pathname, query: queryWithoutPanel }, undefined, {
      shallow: true,
    })
    snap.setPanelKey(undefined)
  }

  const { data: addons, isLoading } = useProjectAddonsQuery({ projectRef })
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const { mutate: updateAddon, isLoading: isUpdating } = useProjectAddonUpdateMutation({
    onSuccess: () => {
      toast.success(`Successfully enabled IPv4`)
      onClose()
    },
    onError: (error) => {
      toast.error(`Unable to enable IPv4: ${error.message}`)
    },
  })
  const { mutate: removeAddon, isLoading: isRemoving } = useProjectAddonRemoveMutation({
    onSuccess: () => {
      toast.success(`Successfully disabled IPv4.`)
      onClose()
    },
    onError: (error) => {
      toast.error(`Unable to disable IPv4: ${error.message}`)
    },
  })
  const isSubmitting = isUpdating || isRemoving

  const subscriptionIpV4Option = (addons?.selected_addons ?? []).find(
    (addon) => addon.type === 'ipv4'
  )
  const availableOptions =
    (addons?.available_addons ?? []).find((addon) => addon.type === 'ipv4')?.variants ?? []

  const isFreePlan = subscription?.plan?.id === 'free'
  const hasChanges = selectedOption !== (subscriptionIpV4Option?.variant.identifier ?? 'ipv4_none')
  const selectedIPv4 = availableOptions.find((option) => option.identifier === selectedOption)

  useEffect(() => {
    if (visible) {
      if (subscriptionIpV4Option !== undefined) {
        setSelectedOption(subscriptionIpV4Option.variant.identifier)
      } else {
        setSelectedOption('ipv4_none')
      }
      Telemetry.sendActivity(
        {
          activity: 'Side Panel Viewed',
          source: 'Dashboard',
          data: {
            title: 'IPv4',
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
    if (selectedOption === 'ipv4_none' && subscriptionIpV4Option !== undefined) {
      removeAddon({ projectRef, variant: subscriptionIpV4Option.variant.identifier })
    } else {
      updateAddon({ projectRef, type: 'ipv4', variant: selectedOption as AddonVariantId })
    }
  }

  return (
    <SidePanel
      size="large"
      visible={visible}
      onCancel={onClose}
      onConfirm={onConfirm}
      loading={isLoading || isSubmitting}
      disabled={isFreePlan || isLoading || !hasChanges || isSubmitting || !canUpdateIPv4}
      tooltip={
        isFreePlan
          ? 'Unable to enable IPv4 on a free plan'
          : !canUpdateIPv4
            ? 'You do not have permission to update IPv4'
            : undefined
      }
      header={
        <div className="flex items-center justify-between">
          <h4>Dedicated IPv4 address</h4>
          <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
            <Link
              href="https://supabase.com/docs/guides/platform/ipv4-address"
              target="_blank"
              rel="noreferrer"
            >
              About dedicated IPv4 addresses
            </Link>
          </Button>
        </div>
      }
    >
      <SidePanel.Content>
        <div className="py-6 space-y-4">
          <p className="text-sm">
            Direct connections to the database only work if your client is able to resolve IPv6
            addresses. Enabling the dedicated IPv4 add-on allows you to directly connect to your
            database via a IPv4 address.
          </p>

          <p className="text-sm">
            If you are connecting via our connection pooler, you do not need this add-on as our
            pooler resolves to IPv4 addresses. You can check your connection info in your{' '}
            <Link href={`/project/${projectRef}/settings/database`} className="text-brand">
              project database settings
            </Link>
            .
          </p>

          <div className={cn('!mt-8 pb-4', isFreePlan && 'opacity-75')}>
            <Radio.Group
              type="large-cards"
              size="tiny"
              id="ipv4"
              onChange={(event: any) => {
                setSelectedOption(event.target.value)
                Telemetry.sendActivity(
                  {
                    activity: 'Option Selected',
                    source: 'Dashboard',
                    data: {
                      title: 'IPv4',
                      section: 'Add ons',
                      option: event.target.label,
                    },
                    projectRef,
                  },
                  router
                )
              }}
            >
              <Radio
                name="ipv4"
                checked={selectedOption === 'ipv4_none'}
                className="col-span-4 !p-0"
                label="No IPv4"
                value="ipv4_none"
              >
                <div className="w-full group">
                  <div className="border-b border-default px-4 py-2 group-hover:border-control">
                    <p className="text-sm">No IPv4 address</p>
                  </div>
                  <div className="px-4 py-2 flex flex-col justify-between">
                    <p className="text-foreground-light">
                      Use connection pooler or IPv6 for direct connections
                    </p>
                    <div className="flex items-center space-x-1 mt-2">
                      <p className="text-foreground text-sm">$0</p>
                      <p className="text-foreground-light translate-y-[1px]"> / month</p>
                    </div>
                  </div>
                </div>
              </Radio>
              {availableOptions.map((option) => (
                <Radio
                  className="col-span-4 !p-0"
                  name="ipv4"
                  key={option.identifier}
                  disabled={isFreePlan}
                  checked={selectedOption === option.identifier}
                  label={option.name}
                  value={option.identifier}
                >
                  <div className="w-full group">
                    <div className="border-b border-default px-4 py-2 group-hover:border-control">
                      <p className="text-sm">Dedicated IPv4 address</p>
                    </div>
                    <div className="px-4 py-2">
                      <p className="text-foreground-light">
                        Allow direct database connections via IPv4 address
                      </p>
                      <div className="flex items-center space-x-1 mt-2">
                        <p className="text-foreground text-sm">{formatCurrency(option.price)}</p>
                        <p className="text-foreground-light translate-y-[1px]">
                          / month / database
                        </p>
                      </div>
                    </div>
                  </div>
                </Radio>
              ))}
            </Radio.Group>
          </div>

          {hasChanges && (
            <>
              {selectedOption === 'ipv4_none' ||
              (selectedIPv4?.price ?? 0) < (subscriptionIpV4Option?.variant.price ?? 0) ? (
                subscription?.billing_via_partner === false && (
                  <p className="text-sm text-foreground-light">
                    Upon clicking confirm, the add-on is removed immediately and any unused time in
                    the current billing cycle is added as prorated credits to your organization and
                    used in subsequent billing cycles.
                  </p>
                )
              ) : (
                <>
                  <Alert withIcon variant="info" title="Potential downtime">
                    There might be some downtime when enabling the add-on since some DNS clients
                    might have cached the old DNS entry. Generally, this should be less than a
                    minute.
                  </Alert>
                  <p className="text-sm text-foreground-light">
                    By default, this is only applied to the Primary database for your project. If{' '}
                    <Link
                      href="/docs/guides/platform/read-replicas"
                      className="text-brand"
                      target="_blank"
                    >
                      Read replicas
                    </Link>{' '}
                    are used, each replica also gets its own IPv4 address, with a corresponding{' '}
                    <span className="text-foreground">{formatCurrency(selectedIPv4?.price)}</span>{' '}
                    charge.
                  </p>
                  {!subscription?.billing_via_partner && (
                    <p className="text-sm text-foreground-light">
                      Upon clicking confirm, the respective amount will be added to your monthly
                      invoice. The addon is prepaid per month and in case of a downgrade, you get
                      credits for the remaining time. For the current billing cycle you're
                      immediately charged a prorated amount for the remaining days.
                    </p>
                  )}
                </>
              )}
            </>
          )}

          {isFreePlan && (
            <Alert
              withIcon
              variant="info"
              title="IPv4 add-on is unavailable on the free plan"
              actions={
                <Button asChild type="default">
                  <Link href={`/org/${organization?.slug}/billing?panel=subscriptionPlan`}>
                    View available plans
                  </Link>
                </Button>
              }
            >
              Upgrade your plan to enable a IPv4 address for your project
            </Alert>
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default IPv4SidePanel
