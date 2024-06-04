import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { ReactNode } from 'react'
import { Button } from 'ui'

import { useCheckPermissions, useFlag, useSelectedOrganization, useSelectedProject } from 'hooks'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'

interface UpgradeToProProps {
  icon?: ReactNode
  primaryText: string
  secondaryText: string
  addon?: 'pitr' | 'customDomain' | 'computeInstance'
  buttonText?: string
  disabled?: boolean
}

const UpgradeToPro = ({
  icon,
  primaryText,
  secondaryText,
  addon,
  buttonText,
  disabled = false,
}: UpgradeToProProps) => {
  const project = useSelectedProject()
  const organization = useSelectedOrganization()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const plan = subscription?.plan?.id

  const canUpdateSubscription = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  return (
    <div
      className={[
        'block w-full rounded border border-opacity-20 py-4 px-6',
        'border-overlay bg-surface-200',
      ].join(' ')}
    >
      <div className="flex space-x-3">
        {icon && <div className="mt-1">{icon}</div>}
        <div className="flex w-full items-center justify-between space-x-32">
          <div className="space-y-1">
            <p className="text-sm">{primaryText}</p>
            <div>
              <p className="text-sm text-foreground-light">{secondaryText}</p>
            </div>
          </div>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger asChild>
              <Button
                type="primary"
                disabled={!canUpdateSubscription || projectUpdateDisabled || disabled}
                asChild
              >
                <Link
                  href={
                    plan === 'free'
                      ? `/org/${organization?.slug ?? '_'}/billing?panel=subscriptionPlan`
                      : `/project/${project?.ref ?? '_'}/settings/addons?panel=${addon}`
                  }
                >
                  {buttonText || (plan === 'free' ? 'Upgrade to Pro' : 'Enable Addon')}
                </Link>
              </Button>
            </Tooltip.Trigger>
            {!canUpdateSubscription ||
              (projectUpdateDisabled && (
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'border border-background text-center', //border
                        'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                      ].join(' ')}
                    >
                      <span className="text-xs text-foreground">
                        {projectUpdateDisabled ? (
                          <>
                            Subscription changes are currently disabled.
                            <br />
                            Our engineers are working on a fix.
                          </>
                        ) : !canUpdateSubscription ? (
                          'You need additional permissions to amend subscriptions'
                        ) : (
                          ''
                        )}
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              ))}
          </Tooltip.Root>
        </div>
      </div>
    </div>
  )
}

export default UpgradeToPro
