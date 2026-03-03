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
import {
  Button,
  Label_Shadcn_,
  RadioGroup_Shadcn_,
  RadioGroupItem_Shadcn_,
  SidePanel,
  cn,
} from 'ui'
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
            Your project’s direct connection endpoint and dedicated pooler are IPv6-only by default.
            Enable the dedicated IPv4 address add-on to connect from IPv4-only networks.
          </p>

          <p className="text-sm">
            The shared pooler endpoint accepts IPv4 connections by default and does not require this
            add-on.
          </p>

          {!isAws && (
            <Admonition
              type="default"
              title="Dedicated IPv4 address is only available for AWS projects"
            />
          )}

          <div className={cn('!mt-8 pb-4', !hasAccessToIPv4 && 'opacity-75')}>
            <RadioGroup_Shadcn_
              name="ipv4"
              value={selectedOption}
              onValueChange={setSelectedOption}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div
                className={cn(
                  'w-full rounded-md border p-0 transition-colors',
                  selectedOption === 'ipv4_none'
                    ? 'border-foreground bg-selection ring-1 ring-border'
                    : 'border-default hover:border-control'
                )}
              >
                <div className="flex items-start">
                  <RadioGroupItem_Shadcn_
                    value="ipv4_none"
                    id="ipv4_none"
                    className="sr-only aspect-auto h-0 w-0 border-0 p-0 overflow-hidden"
                  />
                  <Label_Shadcn_
                    htmlFor="ipv4_none"
                    className="cursor-pointer flex-1 font-normal min-w-0"
                  >
                    <div className="px-4 py-3">
                      <p className="text-sm font-medium">No IPv4 address</p>
                      <p className="text-foreground-light text-sm mt-1">
                        Use shared pooler or IPv6 for database connections.
                      </p>
                      <div className="flex items-center space-x-1 mt-2">
                        <p className="text-foreground text-sm">$0</p>
                        <p className="text-foreground-light translate-y-[1px] text-sm">/ month</p>
                      </div>
                    </div>
                  </Label_Shadcn_>
                </div>
              </div>
              {availableOptions.map((option) => (
                <div
                  key={option.identifier}
                  className={cn(
                    'w-full rounded-md border p-0 transition-colors',
                    selectedOption === option.identifier
                      ? 'border-foreground bg-selection ring-1 ring-border'
                      : 'border-default hover:border-control'
                  )}
                >
                  <div className="flex items-start">
                    <RadioGroupItem_Shadcn_
                      value={option.identifier}
                      id={option.identifier}
                      disabled={!hasAccessToIPv4 || !isAws}
                      className="sr-only aspect-auto h-0 w-0 border-0 p-0 overflow-hidden"
                    />
                    <Label_Shadcn_
                      htmlFor={option.identifier}
                      className="cursor-pointer flex-1 font-normal min-w-0"
                    >
                      <div className="px-4 py-3">
                        <p className="text-sm font-medium">Dedicated IPv4 address</p>
                        <p className="text-foreground-light text-sm mt-1">
                          Allow database connections from IPv4 networks.
                        </p>
                        <div className="flex items-center space-x-1 mt-3 text-sm">
                          <p className="text-sm" translate="no">
                            {formatCurrency(option.price)}
                          </p>
                          <p className="text-foreground-light translate-y-[0.5px] ">
                            / month / database
                          </p>
                        </div>
                      </div>
                    </Label_Shadcn_>
                  </div>
                </div>
              ))}
            </RadioGroup_Shadcn_>
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
                  <InlineLink href={`${DOCS_URL}/guides/platform/read-replicas`} target="_blank">
                    read replicas
                  </InlineLink>{' '}
                  are used, each replica also gets its own IPv4 address, with a corresponding{' '}
                  <span className="text-foreground">{formatCurrency(selectedIPv4?.price)}</span>{' '}
                  charge.
                </p>
              )}
              <p className="text-sm text-foreground-light">
                There are no immediate charges. The add-on is billed at the end of your billing
                cycle based on your usage and prorated to the hour.
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
