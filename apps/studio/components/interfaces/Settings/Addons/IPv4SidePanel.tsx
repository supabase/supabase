import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { InlineLink } from 'components/ui/InlineLink'
import { useProjectAddonRemoveMutation } from 'data/subscriptions/project-addon-remove-mutation'
import { useProjectAddonUpdateMutation } from 'data/subscriptions/project-addon-update-mutation'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import type { AddonVariantId } from 'data/subscriptions/types'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useIsAwsCloudProvider } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { formatCurrency } from 'lib/helpers'
import { useAddonsPagePanel } from 'state/addons-page'
import { Button, Radio, SidePanel, cn } from 'ui'
import { Admonition } from 'ui-patterns'

const IPv4SidePanel = () => {
  const isAws = useIsAwsCloudProvider()
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const [selectedOption, setSelectedOption] = useState<string>('ipv4_none')

  const { can: canUpdateIPv4 } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const { panel, closePanel } = useAddonsPagePanel()
  const visible = panel === 'ipv4'

  const { data: addons, isPending: isLoading } = useProjectAddonsQuery({ projectRef })
  const { mutate: updateAddon, isPending: isUpdating } = useProjectAddonUpdateMutation({
    onSuccess: () => {
      toast.success(`Successfully enabled IPv4`)
      closePanel()
    },
    onError: (error) => {
      toast.error(`Unable to enable IPv4: ${error.message}`)
    },
  })
  const { mutate: removeAddon, isPending: isRemoving } = useProjectAddonRemoveMutation({
    onSuccess: () => {
      toast.success(`Successfully disabled IPv4.`)
      closePanel()
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

  const isFreePlan = organization?.plan?.id === 'free'
  const { hasAccess: hasAccessToIPv4, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('ipv4')
  const hasChanges = selectedOption !== (subscriptionIpV4Option?.variant.identifier ?? 'ipv4_none')
  const selectedIPv4 = availableOptions.find((option) => option.identifier === selectedOption)
  const isPgBouncerEnabled = !isFreePlan

  useEffect(() => {
    if (visible) {
      if (subscriptionIpV4Option !== undefined) {
        setSelectedOption(subscriptionIpV4Option.variant.identifier)
      } else {
        setSelectedOption('ipv4_none')
      }
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
      onCancel={closePanel}
      onConfirm={onConfirm}
      loading={isLoading || isSubmitting || isLoadingEntitlement}
      disabled={
        !hasAccessToIPv4 ||
        isLoadingEntitlement ||
        isLoading ||
        !hasChanges ||
        isSubmitting ||
        !canUpdateIPv4 ||
        !isAws
      }
      tooltip={
        !hasAccessToIPv4
          ? 'Unable to enable IPv4 on a Free Plan'
          : !canUpdateIPv4
            ? 'You do not have permission to update IPv4'
            : undefined
      }
      header={
        <div className="flex w-full items-center justify-between">
          <h4>Dedicated IPv4 address</h4>
          <DocsButton href={`${DOCS_URL}/guides/platform/ipv4-address`} />
        </div>
      }
    >
      <SidePanel.Content>
        <div className="py-6 space-y-4">
          <p className="text-sm">
            Your project’s direct connection endpoint and dedicated pooler are IPv6-only by default. Enable the dedicated IPv4 address add-on to connect from IPv4-only networks.
          </p>

          <p className="text-sm">
            The Shared Pooler endpoint accepts IPv4 connections by default and does not require this add-on.
          </p>


          {!isAws && (
            <Admonition
              type="default"
              title="Dedicated IPv4 address is only available for AWS projects"
            />
          )}


          <div className={cn('!mt-8 pb-4', !hasAccessToIPv4 && 'opacity-75')}>
            <Radio.Group
              type="large-cards"
              size="tiny"
              id="ipv4"
              onChange={(event: any) => setSelectedOption(event.target.value)}
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
                  disabled={!hasAccessToIPv4 || !isAws}
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
                        <p className="text-foreground text-sm" translate="no">
                          {formatCurrency(option.price)}
                        </p>
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
              <Admonition
                type="note"
                title="Potential downtime"
                description="There might be some downtime when enabling the add-on since some DNS clients might
                have cached the old DNS entry. Generally, this should be less than a minute."
              />
              {selectedOption !== 'ipv4_none' && (
                <p className="text-sm text-foreground-light">
                  By default, this is only applied to the primary database for your project. If{' '}
                  <InlineLink
                    href={`${DOCS_URL}/guides/platform/read-replicas`}
                    target="_blank"
                  >
                    read replicas
                  </InlineLink>{' '}
                  are used, each replica also gets its own IPv4 address, with a corresponding{' '}
                  <span className="text-foreground">{formatCurrency(selectedIPv4?.price)}</span>{' '}
                  charge.
                </p>
              )}
              <p className="text-sm text-foreground-light">
                There are no immediate charges. The add-on is billed at the end of your billing cycle
                based on your usage and prorated to the hour.
              </p>
            </>
          )}

          {!hasAccessToIPv4 && (
            <Admonition type="note" title="IPv4 add-on is unavailable on the Free Plan">
              <p>Upgrade your plan to enable an IPv4 address for your project</p>
              <Button asChild type="default">
                <Link
                  href={`/org/${organization?.slug}/billing?panel=subscriptionPlan&source=ipv4SidePanel`}
                >
                  View available plans
                </Link>
              </Button>
            </Admonition>
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default IPv4SidePanel
