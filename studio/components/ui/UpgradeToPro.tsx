import { Button, IconClock } from 'ui'
import Link from 'next/link'
import { FC, ReactNode } from 'react'

interface Props {
  icon?: ReactNode
  primaryText: string
  projectRef: string
  secondaryText: string
}

const UpgradeToPro: FC<Props> = ({ icon, primaryText, projectRef, secondaryText }) => (
  <div
    className={[
      'block w-full rounded border border-opacity-20 py-4 px-6',
      'border-gray-600 bg-gray-100',
      'dark:border-gray-300 dark:bg-gray-400',
    ].join(' ')}
  >
    <div className="flex space-x-3">
      {icon && <div className="mt-1">{icon}</div>}
      <div className="flex w-full items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm">{primaryText}</p>
          <div>
            <p className="text-sm text-scale-1100">{secondaryText}</p>
          </div>
        </div>
        <Link href={`/project/${projectRef}/settings/billing/update`}>
          <Button type="primary">Upgrade to Pro</Button>
        </Link>
      </div>
    </div>
  </div>
)

export default UpgradeToPro
