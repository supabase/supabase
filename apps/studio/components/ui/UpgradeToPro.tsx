import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ReactNode } from 'react'

import { useFlag } from 'common'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { cn } from 'ui'
import { ButtonTooltip } from './ButtonTooltip'
import { UpgradePlanButton } from './UpgradePlanButton'

interface UpgradeToProProps {
  icon?: ReactNode
  primaryText: string
  secondaryText: string
  addon?: 'pitr' | 'customDomain'
  buttonText?: string
  source?: string
  disabled?: boolean
  fullWidth?: boolean
}

const UpgradeToPro = ({
  icon,
  primaryText,
  secondaryText,
  addon,
  buttonText,
  source = 'upgrade',
  disabled = false,
  fullWidth = false,
}: UpgradeToProProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const plan = organization?.plan?.id

  const { can: canUpdateSubscription } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  return (
    <div
      className={cn(
        'block w-full py-4 px-6 bg-surface-200',
        fullWidth ? 'border-b' : 'border border-opacity-20 border-overlay rounded'
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
            <UpgradePlanButton
              type="primary"
              plan="Pro"
              source={source}
              disabled={disabled}
              href={
                plan === 'free'
                  ? `/org/${organization?.slug ?? '_'}/billing?panel=subscriptionPlan&source=${source}`
                  : addon == null
                    ? `/org/${organization?.slug ?? '_'}/billing?panel=costControl&source=${source}`
                    : `/project/${project?.ref ?? '_'}/settings/addons?panel=${addon}&source=${source}`
              }
            >
              {buttonText || (plan === 'free' ? 'Upgrade to Pro' : 'Enable add on')}
            </UpgradePlanButton>
          )}
        </div>
      </div>
    </div>
  )
}

export default UpgradeToPro
