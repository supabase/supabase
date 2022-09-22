import { FC, useEffect, ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { Badge, IconList, Loading } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore, withAuth } from 'hooks'
import BaseLayout from 'components/layouts'
import NoPermission from 'components/ui/NoPermission'
import LogsNavigation from 'components/interfaces/Settings/Logs/LogsNavigation'

interface Props {
  subtitle?: ReactNode
  children?: ReactNode
}

const PageLayout: FC<Props> = ({ subtitle, children }) => {
  const canUseLogsExplorer = checkPermissions(PermissionAction.ANALYTICS_READ, 'logflare')

  if (!canUseLogsExplorer) {
    return (
      <BaseLayout>
        <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
          <NoPermission isFullPage resourceText="access your project's logs explorer" />
        </main>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout>
      <div className="flex h-full flex-grow flex-col py-6">
        <div
          className={[
            'mx-auto flex w-full flex-col gap-4 px-5 transition-all',
            '1xl:px-28 lg:px-16 xl:px-24 2xl:px-32',
          ].join(' ')}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-6 w-6 items-center justify-center rounded border
            border-brand-600 bg-brand-300 text-brand-900
          "
            >
              <IconList size={14} strokeWidth={3} />
            </div>
            <h1 className="text-2xl text-scale-1200">Logs Explorer</h1>
            {subtitle && <Badge color="scale">{subtitle}</Badge>}
          </div>
          <LogsNavigation />
        </div>
        <div
          className={[
            'mx-auto flex h-full w-full flex-grow flex-col gap-4 transition-all',
            '1xl:px-28 px-5 lg:px-16 2xl:px-32',
          ].join(' ')}
        >
          {children}
        </div>
      </div>
    </BaseLayout>
  )
}

export default withAuth(observer(PageLayout))
