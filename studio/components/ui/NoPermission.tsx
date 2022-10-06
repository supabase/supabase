import { IconAlertCircle } from 'ui'
import { FC } from 'react'

interface Props {
  resourceText: string
  isFullPage?: boolean
}

const NoPermission: FC<Props> = ({ resourceText, isFullPage = false }) => {
  const NoPermissionMessage = ({}) => (
    <div
      className={[
        'block w-full rounded border border-opacity-20 py-4 px-6',
        'border-gray-600 bg-gray-100',
        'dark:border-gray-300 dark:bg-gray-400',
      ].join(' ')}
    >
      <div className="flex space-x-3">
        <div className="mt-1">
          <IconAlertCircle size="large" />
        </div>
        <div className="flex w-full items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm">You need additional permissions to {resourceText}</p>
            <div>
              <p className="text-sm text-scale-1100">
                Contact your organization owner or adminstrator for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (isFullPage) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-[550px]">
          <NoPermissionMessage />
        </div>
      </div>
    )
  } else {
    return <NoPermissionMessage />
  }
}

export default NoPermission
