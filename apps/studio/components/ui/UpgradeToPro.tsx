import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { ReactNode } from 'react'

import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions, useFlag, useSelectedOrganization, useSelectedProject } from 'hooks'
import { Button, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_, Tooltip_Shadcn_, cn } from 'ui'

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
      className={cn(
        'block w-full rounded border border-opacity-20 py-4 px-6',
        'border-overlay bg-surface-200'
      )}
    >
      <div className="flex gap-x-3">
        {icon && <div className="mt-1">{icon}</div>}
        <div className="flex w-full items-center justify-between gap-x-32">
          <div className="space-y-1">
            <p className="text-sm">{primaryText}</p>
            <div>
              <p className="text-sm text-foreground-light">{secondaryText}</p>
            </div>
          </div>
          {!canUpdateSubscription || projectUpdateDisabled ? (
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <Button disabled type="primary" className="pointer-events-auto">
                  {buttonText || (plan === 'free' ? 'Upgrade to Pro' : 'Enable add on')}
                </Button>
              </TooltipTrigger_Shadcn_>
              <TooltipContent_Shadcn_ side="bottom">
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
              </TooltipContent_Shadcn_>
            </Tooltip_Shadcn_>
          ) : (
            <Button
              asChild
              type="primary"
              disabled={!canUpdateSubscription || projectUpdateDisabled || disabled}
            >
              <Link
                href={
                  plan === 'free'
                    ? `/org/${organization?.slug ?? '_'}/billing?panel=subscriptionPlan`
                    : `/project/${project?.ref ?? '_'}/settings/addons?panel=${addon}`
                }
              >
                {buttonText || (plan === 'free' ? 'Upgrade to Pro' : 'Enable add on')}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default UpgradeToPro
