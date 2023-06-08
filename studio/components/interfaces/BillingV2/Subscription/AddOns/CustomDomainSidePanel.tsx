import clsx from 'clsx'
import { useParams } from 'common'
import { useProjectAddonRemoveMutation } from 'data/subscriptions/project-addon-remove-mutation'
import { useProjectAddonUpdateMutation } from 'data/subscriptions/project-addon-update-mutation'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useStore } from 'hooks'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import { Alert, Button, IconExternalLink, Radio, SidePanel } from 'ui'

const CustomDomainSidePanel = () => {
  const { ui } = useStore()
  const { ref: projectRef } = useParams()

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [selectedOption, setSelectedOption] = useState<string>('cd_none')

  const snap = useSubscriptionPageStateSnapshot()
  const visible = snap.panelKey === 'customDomain'
  const onClose = () => snap.setPanelKey(undefined)

  const { data: addons, isLoading } = useProjectAddonsQuery({ projectRef })
  const { data: subscription } = useProjectSubscriptionV2Query({ projectRef })
  const { mutateAsync: updateAddon } = useProjectAddonUpdateMutation()
  const { mutateAsync: removeAddon } = useProjectAddonRemoveMutation()

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

    try {
      setIsSubmitting(true)

      if (selectedOption === 'cd_none' && subscriptionCDOption !== undefined) {
        await removeAddon({ projectRef, variant: subscriptionCDOption.variant.identifier })
      } else {
        await updateAddon({ projectRef, type: 'custom_domain', variant: selectedOption })
      }

      ui.setNotification({
        category: 'success',
        message: `Successfully ${
          selectedOption === 'cd_none' ? 'disabled' : 'enabled'
        } custom domain`,
      })
      onClose()
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Unable to update custom domain: ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SidePanel
      size="large"
      visible={visible}
      onCancel={onClose}
      onConfirm={onConfirm}
      loading={isLoading || isSubmitting}
      disabled={isFreePlan || isLoading || !hasChanges || isSubmitting}
      tooltip={isFreePlan ? 'Unable to enable custom domain on a free plan' : undefined}
      header={
        <div className="flex items-center justify-between">
          <h4>Custom domains</h4>
          <Link href="https://supabase.com/docs/guides/platform/custom-domains">
            <a target="_blank" rel="noreferrer">
              <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                About custom domains
              </Button>
            </a>
          </Link>
        </div>
      }
    >
      <SidePanel.Content>
        <div className="py-6 space-y-4">
          <p className="text-sm">
            Custom domains allow you to present a branded experience to your users. You may set up
            your custom domain in the{' '}
            <Link href={`/project/${projectRef}/settings/general`}>
              <a className="text-brand-900">General Settings</a>
            </Link>{' '}
            page after enabling the add-on.
          </p>

          <div className={clsx('!mt-8 pb-4', isFreePlan && 'opacity-75')}>
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
                  <div className="border-b border-scale-500 px-4 py-2 group-hover:border-scale-600">
                    <p className="text-sm">No custom domain</p>
                  </div>
                  <div className="px-4 py-2">
                    <p className="text-scale-1000">Use the default supabase domain for your API</p>
                    <div className="flex items-center space-x-1 mt-2">
                      <p className="text-scale-1200 text-sm">$0</p>
                      <p className="text-scale-1000 translate-y-[1px]"> / month</p>
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
                    <div className="border-b border-scale-500 px-4 py-2 group-hover:border-scale-600">
                      <p className="text-sm">{option.name}</p>
                    </div>
                    <div className="px-4 py-2">
                      <p className="text-scale-1000">Present a branded experience to your users</p>
                      <div className="flex items-center space-x-1 mt-2">
                        <p className="text-scale-1200 text-sm">${option.price}</p>
                        <p className="text-scale-1000 translate-y-[1px]"> / month</p>
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
              (selectedCustomDomain?.price ?? 0) < (subscriptionCDOption?.variant.price ?? 0) ? (
                <p className="text-sm text-scale-1100">
                  Upon clicking confirm, the amount of that's unused during the current billing
                  cycle will be returned as credits that can be used for subsequent billing cycles
                </p>
              ) : (
                <p className="text-sm text-scale-1100">
                  Upon clicking confirm, the amount of{' '}
                  <span className="text-scale-1200">
                    ${selectedCustomDomain?.price.toLocaleString()}
                  </span>{' '}
                  will be added to your monthly invoice. You're immediately charged for the
                  remaining days of your billing cycle. The addon is prepaid per month and in case
                  of a downgrade, you get credits for the remaining time.
                </p>
              )}
            </>
          )}

          {isFreePlan && (
            <Alert
              withIcon
              variant="info"
              title="Custom domains are unavailable on the free plan"
              actions={
                <Button type="default" onClick={() => snap.setPanelKey('subscriptionPlan')}>
                  View available plans
                </Button>
              }
            >
              Upgrade your project's plan to add a custom domain to your project
            </Alert>
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default CustomDomainSidePanel
