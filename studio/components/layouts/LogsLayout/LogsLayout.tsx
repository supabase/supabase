import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import NoPermission from 'components/ui/NoPermission'
import ProductMenu from 'components/ui/ProductMenu'
import { useCheckPermissions, useIsFeatureEnabled, useSelectedProject, withAuth } from 'hooks'
import ProjectLayout from '../'
import { generateLogsMenu } from './LogsMenu.utils'

interface LogsLayoutProps {
  title?: string
}

const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  const router = useRouter()
  const pathArr = router.pathname.split('/')
  const page = pathArr[pathArr.length - 1]

  const {
    projectAuthAll: authEnabled,
    projectStorageAll: storageEnabled,
    realtimeAll: realtimeEnabled,
  } = useIsFeatureEnabled(['project_storage:all', 'project_auth:all', 'realtime:all'])

  const project = useSelectedProject()

  const canUseLogsExplorer = useCheckPermissions(PermissionAction.ANALYTICS_READ, 'logflare')

  if (!canUseLogsExplorer) {
    return (
      <ProjectLayout>
        <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
          <NoPermission isFullPage resourceText="access your project's logs explorer" />
        </main>
      </ProjectLayout>
    )
  }

  return (
    <ProjectLayout
      title={title}
      product="Logs"
      productMenu={
        <ProductMenu
          page={page}
          menu={generateLogsMenu(project, {
            auth: authEnabled,
            storage: storageEnabled,
            realtime: realtimeEnabled,
          })}
        />
      }
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(LogsLayout)
