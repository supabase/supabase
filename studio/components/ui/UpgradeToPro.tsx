import { Button } from 'ui'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { FC, ReactNode } from 'react'
import { useStore } from 'hooks'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'

interface Props {
  icon?: ReactNode
  primaryText: string
  projectRef: string
  secondaryText: string
}

const UpgradeToPro: FC<Props> = ({ icon, primaryText, projectRef, secondaryText }) => {
  const { ui } = useStore()
  const tier = ui.selectedProject?.subscription_tier

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
          <Link href={`/project/${projectRef}/settings/billing/update`}>
            <a>
              <Button type="primary">
                {tier === PRICING_TIER_PRODUCT_IDS.FREE ? 'Upgrade to Pro' : 'Modify subscription'}
              </Button>
            </a>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default observer(UpgradeToPro)
