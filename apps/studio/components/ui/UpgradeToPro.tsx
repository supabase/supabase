import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { ReactNode } from 'react'

import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { Button, cn } from 'ui'
import { ButtonTooltip } from './ButtonTooltip'

interface UpgradeToProProps {
  icon?: ReactNode
  primaryText: string
  secondaryText: string
  addon?: 'pitr' | 'customDomain'
  buttonText?: string
  source?: string
  disabled?: boolean
}

const UpgradeToPro = ({
  icon,
  primaryText,
  secondaryText,
  addon,
  buttonText,
  source = 'upgrade',
  disabled = false,
}: UpgradeToProProps) => {
  const project = useSelectedProject()
  const organization = useSelectedOrganization()
  const plan = organization?.plan?.id

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
        <div className="flex flex-col md:flex-row w-full md:items-center justify-between gap-4 md:gap-x-8">
          <div className="space-y-1 flex-1 max-w-2xl">
            <p className="text-sm">{primaryText}</p>
            <div>
              <p className="text-sm text-foreground-light">{secondaryText}</p>
            </div>
          </div>
          {!canUpdateSubscription || projectUpdateDisabled ? (
            <ButtonTooltip
              disabled
              type="primary"
              tooltip={{
                content: {
                  side: 'bottom',
                  text: projectUpdateDisabled
                    ? 'Subscription changes are currently disabled, our engineers are working on a fix'
                    : !canUpdateSubscription
                      ? 'You need additional permissions to amend subscriptions'
                      : undefined,
                },
              }}
            >
              {buttonText || (plan === 'free' ? 'Upgrade to Pro' : 'Enable add on')}
            </ButtonTooltip>
          ) : (
            <Button
              asChild
              type="primary"
              disabled={!canUpdateSubscription || projectUpdateDisabled || disabled}
            >
              <Link
                href={
                  plan === 'free'
                    ? `/org/${organization?.slug ?? '_'}/billing?panel=subscriptionPlan&source=${source}`
                    : addon == null
                      ? `/org/${organization?.slug ?? '_'}/billing?panel=costControl&source=${source}`
                      : `/project/${project?.ref ?? '_'}/settings/addons?panel=${addon}&source=${source}`
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
