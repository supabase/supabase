import { PropsWithChildren } from 'react'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { checkPermissions, useStore, withAuth } from 'hooks'
import ProjectLayout from '../'
import NoPermission from 'components/ui/NoPermission'
import { generateLogsMenu } from './LogsMenu.utils'
import ProductMenu from 'components/ui/ProductMenu'

interface LogsLayoutProps {
  title?: string
}

const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  const { ui } = useStore()
  const router = useRouter()
  const pathArr = router.pathname.split('/')
  const page = pathArr[pathArr.length - 1]

  const project = ui.selectedProject

  const canUseLogsExplorer = checkPermissions(PermissionAction.ANALYTICS_READ, 'logflare')

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
      productMenu={<ProductMenu page={page} menu={generateLogsMenu(project)} />}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(observer(LogsLayout))
