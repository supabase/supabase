import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useFlag, useParams } from 'common'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  cn,
  RadioGroupCard,
  RadioGroupCardItem,
  SidePanel,
} from 'ui'

import { TaxDisclaimer } from '@/components/interfaces/Billing/TaxDisclaimer'
import { DocsButton } from '@/components/ui/DocsButton'
import { UpgradeToPro } from '@/components/ui/UpgradeToPro'
import { useProjectAddonRemoveMutation } from '@/data/subscriptions/project-addon-remove-mutation'
import { useProjectAddonUpdateMutation } from '@/data/subscriptions/project-addon-update-mutation'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import type { AddonVariantId } from '@/data/subscriptions/types'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { DOCS_URL } from '@/lib/constants'
import { formatCurrency } from '@/lib/helpers'
import { useAddonsPagePanel } from '@/state/addons-page'

const CustomDomainSidePanel = () => {
  const { ref: projectRef } = useParams()
  const customDomainsDisabledDueToQuota = useFlag('customDomainsDisabledDueToQuota')

  const [selectedOption, setSelectedOption] = useState<string>('cd_none')

  const { can: canUpdateCustomDomain } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const { panel, closePanel } = useAddonsPagePanel()
  const visible = panel === 'customDomain'

  const { data: addons, isPending: isLoading } = useProjectAddonsQuery({ projectRef })
  const { mutate: updateAddon, isPending: isUpdating } = useProjectAddonUpdateMutation({
    onSuccess: () => {
      toast.success(`Successfully enabled custom domain`)
      closePanel()
    },
    onError: (error) => {
      toast.error(`Unable to enable custom domain: ${error.message}`)
    },
  })
  const { mutate: removeAddon, isPending: isRemoving } = useProjectAddonRemoveMutation({
    onSuccess: () => {
      toast.success(`Successfully disabled custom domain`)
      closePanel()
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

  const { hasAccess: hasAccessToCustomDomain, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('custom_domain')
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
      onCancel={closePanel}
      onConfirm={onConfirm}
      loading={isLoading || isSubmitting || isLoadingEntitlement}
      disabled={
        !hasAccessToCustomDomain ||
        isLoadingEntitlement ||
        isLoading ||
        !hasChanges ||
        isSubmitting ||
        !canUpdateCustomDomain ||
        // Allow disabling, but do not allow opting in
        (subscriptionCDOption === undefined && customDomainsDisabledDueToQuota)
      }
      tooltip={
        !hasAccessToCustomDomain
          ? 'Unable to enable custom domain on a Free Plan'
          : !canUpdateCustomDomain
            ? 'You do not have permission to update custom domain'
            : undefined
      }
      header={
        <div className="flex w-full items-center justify-between">
          <h4>Custom domains</h4>
          <DocsButton href={`${DOCS_URL}/guides/platform/custom-domains`} />
        </div>
      }
    >
      <SidePanel.Content>
        <div className="py-6 space-y-4">
          {subscriptionCDOption === undefined &&
            selectedCustomDomain !== undefined &&
            customDomainsDisabledDueToQuota && (
              <Alert_Shadcn_ variant="default" className="mb-2">
                <AlertCircle className="h-4 w-4" />
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

          <div className={cn('mt-8! pb-4', !hasAccessToCustomDomain && 'opacity-75')}>
            <RadioGroupCard
              id="custom-domain"
              className="flex flex-wrap gap-3"
              value={selectedOption}
              onValueChange={(value) => setSelectedOption(value)}
            >
              <RadioGroupCardItem
                value="cd_none"
                id="cd_none"
                label={
                  <div className="w-full group text-left">
                    <div className="border-b border-default px-4 py-2 group-hover:border-control">
                      <p className="text-sm">No custom domain</p>
                    </div>
                    <div className="px-4 py-2">
                      <p className="text-foreground-light">
                        Use the default supabase domain for your API
                      </p>
                      <div className="flex items-center space-x-1 mt-2">
                        <p className="text-foreground text-sm" translate="no">
                          $0
                        </p>
                        <p className="text-foreground-light translate-y-px"> / month</p>
                      </div>
                    </div>
                  </div>
                }
                showIndicator={false}
              />
              {availableOptions.map((option) => (
                <RadioGroupCardItem
                  key={option.identifier}
                  value={option.identifier}
                  id={option.identifier}
                  label={
                    <div className="w-full group text-left">
                      <div className="border-b border-default px-4 py-2 group-hover:border-control">
                        <p className="text-sm">{option.name}</p>
                      </div>
                      <div className="px-4 py-2">
                        <p className="text-foreground-light">
                          Present a branded experience to your users
                        </p>
                        <div className="flex items-center space-x-1 mt-2">
                          <p className="text-foreground text-sm" translate="no">
                            {formatCurrency(option.price)}
                          </p>
                          <p className="text-foreground-light translate-y-px"> / month</p>
                        </div>
                      </div>
                    </div>
                  }
                  showIndicator={false}
                />
              ))}
            </RadioGroupCard>
            <TaxDisclaimer className="mt-3" />
          </div>

          {hasChanges && selectedOption !== 'cd_none' && (
            <p className="text-sm text-foreground-light">
              There are no immediate charges. The add-on is billed at the end of your billing cycle
              based on your usage and prorated to the hour.
            </p>
          )}

          {!hasAccessToCustomDomain && (
            <UpgradeToPro
              addon="customDomain"
              source="customDomainSidePanel"
              featureProposition="enable custom domains"
              primaryText="Custom domains are a Pro Plan add-on"
              secondaryText="Enable the add-on to serve your project on your own domain name."
            />
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default CustomDomainSidePanel
