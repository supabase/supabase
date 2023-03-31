import { Button } from 'ui'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { FC, ReactNode } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'

import { checkPermissions, useStore, useFlag } from 'hooks'
import { useParams } from 'common/hooks'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { PermissionAction } from '@supabase/shared-types/out/constants'

interface Props {
  icon?: ReactNode
  primaryText: string
  projectRef: string
  secondaryText: string
}

const UpgradeToPro: FC<Props> = ({ icon, primaryText, projectRef, secondaryText }) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const tier = ui.selectedProject?.subscription_tier

  const canUpdateSubscription = checkPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')
  const isEnterprise = tier === PRICING_TIER_PRODUCT_IDS.ENTERPRISE

  return (
    <div
      className={[
        'block w-full rounded border border-opacity-20 py-4 px-6',
        'border-gray-600 bg-gray-100',
        'dark:border-gray-300 dark:bg-gray-400',
      ].join(' ')}
    >
      <div className="flex space-x-3">
        {icon && <div className="mt-1">{icon}</div>}
        <div className="flex w-full items-center justify-between space-x-32">
          <div className="space-y-1">
            <p className="text-sm">{primaryText}</p>
            <div>
              <p className="text-sm text-scale-1100">{secondaryText}</p>
            </div>
          </div>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              <Button type="primary" disabled={!canUpdateSubscription || projectUpdateDisabled}>
                <Link
                  href={
                    isEnterprise
                      ? `/project/${ref}/settings/billing/update/enterprise`
                      : `/project/${ref}/settings/billing/update`
                  }
                >
                  <a>
                    {tier === PRICING_TIER_PRODUCT_IDS.FREE
                      ? 'Upgrade to Pro'
                      : 'Modify subscription'}
                  </a>
                </Link>
              </Button>
            </Tooltip.Trigger>
            {!canUpdateSubscription || projectUpdateDisabled ? (
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'border border-scale-200 text-center', //border
                      'rounded bg-scale-100 py-1 px-2 leading-none shadow', // background
                    ].join(' ')}
                  >
                    <span className="text-xs text-scale-1200">
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
            ) : (
              <></>
            )}
          </Tooltip.Root>
        </div>
      </div>
    </div>
  )
}

export default observer(UpgradeToPro)
