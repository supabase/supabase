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
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useFlag } from 'hooks/ui/useFlag'
import { formatCurrency } from 'lib/helpers'
import { useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import {
  Alert,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertCircle,
  IconAlertTriangle,
  IconExternalLink,
  Radio,
  SidePanel,
  cn,
} from 'ui'

const CustomDomainSidePanel = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const organization = useSelectedOrganization()
  const customDomainsDisabledDueToQuota = useFlag('customDomainsDisabledDueToQuota')

  const [selectedOption, setSelectedOption] = useState<string>('cd_none')

  const canUpdateCustomDomain = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const snap = useSubscriptionPageStateSnapshot()
  const visible = snap.panelKey === 'customDomain'
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
      toast.success(`Successfully enabled custom domain`)
      onClose()
    },
    onError: (error) => {
      toast.error(`Unable to enable custom domain: ${error.message}`)
    },
  })
  const { mutate: removeAddon, isLoading: isRemoving } = useProjectAddonRemoveMutation({
    onSuccess: () => {
      toast.success(`Successfully disabled custom domain`)
      onClose()
    },
    onError: (error) => {
      toast.error(`Unable to disable custom domain: ${error.message}`)
    },
  })
  const isSubmitting = isUpdating || isRemoving

  const subscriptionCDOption = (addons?.selected_addons ?? []).find(
    (addon) => addon.type === 'custom_domain'
  )
  const availableOptions =
    (addons?.available_addons ?? []).find((addon) => addon.type === 'custom_domain')?.variants ?? []

  const isFreePlan = subscription?.plan?.id === 'free'
  const hasChanges = selectedOption !== (subscriptionCDOption?.variant.identifier ?? 'cd_none')
  const selectedCustomDomain = availableOptions.find(
    (option) => option.identifier === selectedOption
  )

  useEffect(() => {
    if (visible) {
      if (subscriptionCDOption !== undefined) {
        setSelectedOption(subscriptionCDOption.variant.identifier)
      } else {
        setSelectedOption('cd_none')
      }
    }
  }, [visible, isLoading])

  const onConfirm = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (selectedOption === 'cd_none' && subscriptionCDOption !== undefined) {
      removeAddon({ projectRef, variant: subscriptionCDOption.variant.identifier })
    } else {
      updateAddon({ projectRef, type: 'custom_domain', variant: selectedOption as AddonVariantId })
    }
  }

  return (
    <SidePanel
      size="large"
      visible={visible}
      onCancel={onClose}
      onConfirm={onConfirm}
      loading={isLoading || isSubmitting}
      disabled={
        isFreePlan ||
        isLoading ||
        !hasChanges ||
        isSubmitting ||
        !canUpdateCustomDomain ||
        // Allow disabling, but do not allow opting in
        (subscriptionCDOption === undefined && customDomainsDisabledDueToQuota)
      }
      tooltip={
        isFreePlan
          ? 'Unable to enable custom domain on a Free Plan'
          : !canUpdateCustomDomain
            ? 'You do not have permission to update custom domain'
            : undefined
      }
      header={
        <div className="flex items-center justify-between">
          <h4>Custom domains</h4>
          <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
            <Link
              href="https://supabase.com/docs/guides/platform/custom-domains"
              target="_blank"
              rel="noreferrer"
            >
              About custom domains
            </Link>
          </Button>
        </div>
      }
    >
      <SidePanel.Content>
        <div className="py-6 space-y-4">
          {subscriptionCDOption === undefined &&
            selectedCustomDomain !== undefined &&
            customDomainsDisabledDueToQuota && (
              <Alert_Shadcn_ variant="default" className="mb-2">
                <IconAlertCircle className="h-4 w-4" />
                <AlertTitle_Shadcn_>
                  Adding new custom domains temporarily disabled
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_ className="flex flex-col gap-3">
                  We are working with our upstream DNS provider before we are able to sign up new
                  custom domains. Please check back in a few hours.
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            )}
          <p className="text-sm">
            Custom domains allow you to present a branded experience to your users. You may set up
            your custom domain in the{' '}
            <Link href={`/project/${projectRef}/settings/general`} className="text-brand">
              General Settings
            </Link>{' '}
            page after enabling the add-on.
          </p>

          <div className={cn('!mt-8 pb-4', isFreePlan && 'opacity-75')}>
            <Radio.Group
              type="large-cards"
              size="tiny"
              id="custom-domain"
              onChange={(event: any) => setSelectedOption(event.target.value)}
            >
              <Radio
                name="custom-domain"
                checked={selectedOption === 'cd_none'}
                className="col-span-4 !p-0"
                label="No custom domain"
                value="cd_none"
              >
                <div className="w-full group">
                  <div className="border-b border-default px-4 py-2 group-hover:border-control">
                    <p className="text-sm">No custom domain</p>
                  </div>
                  <div className="px-4 py-2">
                    <p className="text-foreground-light">
                      Use the default supabase domain for your API
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
                  name="custom-domain"
                  key={option.identifier}
                  disabled={isFreePlan}
                  checked={selectedOption === option.identifier}
                  label={option.name}
                  value={option.identifier}
                >
                  <div className="w-full group">
                    <div className="border-b border-default px-4 py-2 group-hover:border-control">
                      <p className="text-sm">{option.name}</p>
                    </div>
                    <div className="px-4 py-2">
                      <p className="text-foreground-light">
                        Present a branded experience to your users
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

          {hasChanges && (
            <>
              {selectedOption === 'cd_none' ||
              (selectedCustomDomain?.price ?? 0) < (subscriptionCDOption?.variant.price ?? 0)
                ? subscription?.billing_via_partner === false &&
                  // Old addon billing with upfront payment
                  subscription.usage_based_billing_project_addons === false && (
                    <p className="text-sm text-foreground-light">
                      <span>
                        Upon clicking confirm, the add-on is removed immediately and any unused time
                        in the current billing cycle is added as prorated credits to your
                        organization and used in subsequent billing cycles.
                      </span>
                    </p>
                  )
                : !subscription?.billing_via_partner && (
                    <p className="text-sm text-foreground-light">
                      {subscription?.usage_based_billing_project_addons === false ? (
                        <span>
                          Upon clicking confirm, the amount of{' '}
                          <span className="text-foreground">
                            {formatCurrency(selectedCustomDomain?.price)}
                          </span>{' '}
                          will be added to your monthly invoice. The addon is prepaid per month and
                          in case of a downgrade, you get credits for the remaining time. For the
                          current billing cycle you're immediately charged a prorated amount for the
                          remaining days.
                        </span>
                      ) : (
                        <span>
                          There are no immediate charges. The addon is billed at the end of your
                          billing cycle based on your usage and prorated to the hour.
                        </span>
                      )}
                    </p>
                  )}

              {
                // Billed via partner
                subscription?.billing_via_partner &&
                  // Project addons are still billed the old way (upfront payment)
                  subscription?.usage_based_billing_project_addons === false &&
                  // Scheduled billing plan change
                  subscription.scheduled_plan_change?.target_plan !== undefined && (
                    <Alert_Shadcn_ variant={'warning'} className="mb-2">
                      <IconAlertTriangle className="h-4 w-4" />
                      <AlertDescription_Shadcn_>
                        You have a scheduled subscription change that will be canceled if you change
                        your custom domain add on.
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
                  )
              }
            </>
          )}

          {isFreePlan && (
            <Alert
              withIcon
              variant="info"
              title="Custom domains are unavailable on the Free Plan"
              actions={
                <Button asChild type="default">
                  <Link href={`/org/${organization?.slug}/billing?panel=subscriptionPlan`}>
                    View available plans
                  </Link>
                </Button>
              }
            >
              Upgrade your plan to add a custom domain to your project
            </Alert>
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default CustomDomainSidePanel
